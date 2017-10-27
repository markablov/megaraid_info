const ref = require('ref');
const transport = require('./windows/transport.js');
const mr_frame = require('./megaraid/frame.js');
const mr_data = require('./megaraid/data.js');

const ldstate2str =
{
    [mr_data.const.state.MFI_LD_STATE_OFFLINE]: 'offline',
    [mr_data.const.state.MFI_LD_STATE_PARTIALLY_DEGRADED]: 'partially degraded',
    [mr_data.const.state.MFI_LD_STATE_DEGRADED]: 'degraded',
    [mr_data.const.state.MFI_LD_STATE_OPTIMAL]: 'optimal',
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

class Controller
{
    constructor(handle)
    {
        this.fd = handle;
    }

    async config()
    {
        let res = {};

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
            let params = info.ld_config.params;
            let spans = [];
            for (let j = 0, jlen = params.span_depth; j < jlen; j++)
                spans.push({ar_ref: info.ld_config.span[j].array_ref});
            res[target_id] =
            {
                name: ref.readCString(info.ld_config.properties.name),
                state: ldstate2str[params.state],
                size: info.size * 512,
                is_consistent: params.is_consistent,
                stripe: (1 << params.stripe_size) * 512,
                raid_level: raidlvl2str(params.primary_raid_level, params.secondary_raid_level),
                num_drives: params.num_drives,
                spans: spans
            };
        }
        return res;
    }
}

module.exports = Controller;
