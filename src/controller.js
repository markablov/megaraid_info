const ref = require('ref');
const ref_array = require('ref-array');
const transport = require('./windows/transport.js');
const mr_frame = require('./megaraid/frame.js');
const mr_data = require('./megaraid/data.js');
const scsi_data = require('./megaraid/scsi_data.js');

const ldstate2str =
{
    [mr_data.const.ld_state.MFI_LD_STATE_OFFLINE]: 'Offline',
    [mr_data.const.ld_state.MFI_LD_STATE_PARTIALLY_DEGRADED]: 'Partially degraded',
    [mr_data.const.ld_state.MFI_LD_STATE_DEGRADED]: 'Degraded',
    [mr_data.const.ld_state.MFI_LD_STATE_OPTIMAL]: 'Optimal',
};

const pdstate2str =
{
    [mr_data.const.pd_state.MFI_PD_STATE_UNCONFIGURED_GOOD]: 'Unconfigured Good',
    [mr_data.const.pd_state.MFI_PD_STATE_UNCONFIGURED_BAD]: 'Unconfigured Bad',
    [mr_data.const.pd_state.MFI_PD_STATE_HOT_SPARE]: 'Hot Spare',
    [mr_data.const.pd_state.MFI_PD_STATE_OFFLINE]: 'Offline',
    [mr_data.const.pd_state.MFI_PD_STATE_FAILED]: 'Failed',
    [mr_data.const.pd_state.MFI_PD_STATE_REBUILD]: 'Rebuild',
    [mr_data.const.pd_state.MFI_PD_STATE_ONLINE]: 'Online',
    [mr_data.const.pd_state.MFI_PD_STATE_COPYBACK]: 'Copyback',
    [mr_data.const.pd_state.MFI_PD_STATE_SYSTEM]: 'JBOD',
};

const raidlvl2str = (primary, secondary) =>
{
    switch (primary)
    {
    case mr_data.const.raid_level.DDF_RAID0: return 'RAID 0';
    case mr_data.const.raid_level.DDF_RAID1: return secondary == 0 ? 'RAID 1' : 'RAID 10';
    case mr_data.const.raid_level.DDF_RAID1E: return 'RAID 1E';
    case mr_data.const.raid_level.DDF_RAID3: return 'RAID 3';
    case mr_data.const.raid_level.DDF_RAID5: return secondary == 0 ? 'RAID 5' : 'RAID 50';
    case mr_data.const.raid_level.DDF_RAID5E: return 'RAID 5E';
    case mr_data.const.raid_level.DDF_RAID5EE: return 'RAID 5EE';
    case mr_data.const.raid_level.DDF_RAID6: return secondary == 0 ? 'RAID 6' : 'RAID 60';
    case mr_data.const.raid_level.DDF_JBOD: return 'JBOD';
    case mr_data.const.raid_level.DDF_CONCAT: return 'CONCAT';
    }
};

const inquiry2str = inq =>
{
    inq = ref.get(inq, 0, scsi_data.types.scsi_inquiry_data);
    if (scsi_data.sid_qual_is_vendor_unique(inq)
        || scsi_data.sid_type(inq) != scsi_data.const.type.T_DIRECT
        || scsi_data.sid_qual(inq) != scsi_data.const.qual.SID_QUAL_LU_CONNECTED)
    {
        return '';
    }
    return scsi_data.format_str(inq.vendor) + ' ' + scsi_data.format_str(inq.product) + ' ' + scsi_data.format_str(inq.revision) + ' SN='+scsi_data.format_str(inq.vendor_specific0.toString());
};

const format_ld = ld_config =>
({
    name: ref.readCString(ld_config.properties.name),
    state: ldstate2str[ld_config.params.state],
    is_consistent: ld_config.params.is_consistent,
    stripe: (1 << ld_config.params.stripe_size) * 512,
    raid_level: raidlvl2str(ld_config.params.primary_raid_level, ld_config.params.secondary_raid_level),
    num_drives: ld_config.params.num_drives,
    spans: ld_config.span.toArray().slice(0, ld_config.params.span_depth).map(x => ({ar_ref: x.array_ref}))
});

const format_pd = pd =>
({
    id: pd.encl_index + ':' + pd.slot_number,
    err_count: pd.media_err_count + pd.other_err_count,
    raw_size: pd.raw_size * 512,
    coerced_size: pd.coerced_size * 512,
    state: pdstate2str[pd.fw_state],
    inquiry: inquiry2str(pd.inquiry_data)
});

class Controller
{
    constructor(handle)
    {
        this.fd = handle;
    }

    async config()
    {
        let res = {};

        // first request to receive actual size of config data
        let cfg = await transport.send_packet(this.fd, mr_frame.build_dcmd_frame(...mr_frame.const.DCMD.CFG_READ));
        cfg = ref.get(cfg, 0, mr_data.types.mfi_config_data);
        // second request to receive whole config
        let fullCfg = await transport.send_packet(this.fd, mr_frame.build_dcmd_frame(mr_frame.const.DCMD.CFG_READ[0], cfg.size));
        let offs = mr_data.types.mfi_config_data.size;
        let arrays = ref.get(fullCfg, offs, ref_array(mr_data.types.mfi_array, cfg.array_count)).toArray();
        offs += cfg.array_count * cfg.array_size;
        let lds = ref.get(fullCfg, offs, ref_array(mr_data.types.mfi_ld_config, cfg.log_drv_count)).toArray();
        for (let ld_config of lds)
        {
            let ld_id = ld_config.properties.ld.v.target_id;
            // XXX: have to call it because we need to receive size of LD
            let ld_info = await transport.send_packet(this.fd, mr_frame.build_dcmd_frame(...mr_frame.const.DCMD.LD_GET_INFO, Buffer.from([ld_id])));
            ld_info = ref.get(ld_info, 0, mr_data.types.mfi_ld_info);
            let res_ld = Object.assign({size: ld_info.size * 512}, format_ld(ld_info.ld_config)), spans = [];

            for (let span of res_ld.spans)
            {
                let ar = arrays.find(x => x.array_ref == span.ar_ref);
                if (!ar)
                    throw new Error('Incorrect array reference in span of LD #'+ld_id);

                let ar_pds = [];
                for (let pd of ar.pd.toArray().slice(0, ar.num_drives))
                {
                    let device_id = pd.pd_ref.v.device_id, encl_id = pd.encl.pd+':'+pd.encl.slot;
                    if (device_id == 0xFFFF)
                    {
                        ar_pds.push({id: encl_id, status: 'Missing'});
                        return;
                    }
                    let pd_info = await transport.send_packet(this.fd, mr_frame.build_dcmd_frame(...mr_frame.const.DCMD.PD_GET_INFO, Buffer.from([device_id & 0xFF, device_id >> 8])));
                    pd_info = ref.get(pd_info, 0, mr_data.types.mfi_pd_info);
                    ar_pds.push(format_pd(pd_info));
                }
                spans.push({size: ar.size * 512, num_drives: ar.num_drives, pds: ar_pds});
            }

            res_ld.spans = spans;
            res[ld_id] = res_ld;
        }

        // TODO: information about spare drives

        return res;
    }

    async volumes()
    {
        let res = {};

        let list = await transport.send_packet(this.fd, mr_frame.build_dcmd_frame(...mr_frame.const.DCMD.LD_GET_LIST));
        list = ref.get(list, 0, mr_data.types.mfi_ld_list);
        for (let i = 0, len = list.ld_count, ld_list = list.ld_list; i < len; i++)
        {
            let target_id = ld_list[i].ld.v.target_id;
            let info = await transport.send_packet(this.fd, mr_frame.build_dcmd_frame(...mr_frame.const.DCMD.LD_GET_INFO, Buffer.from([target_id])));
            info = ref.get(info, 0, mr_data.types.mfi_ld_info);
            res[target_id] = Object.assign({size: info.size * 512}, format_ld(info.ld_config));
        }
        return res;
    }
}

module.exports = Controller;
