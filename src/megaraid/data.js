const ref_struct = require('ref-struct');
const ref_array = require('ref-array');
const ref_union = require('ref-union');
const ref_buffer_type = require('../ref-buffer-type.js');
const ref = require('ref');

let E = {types: {}, const: {}};

const uint64 = ref.types.uint64;
const uint32 = ref.types.uint32;
const uint16 = ref.types.uint16;
const uint8 = ref.types.uint8;

E.const.raid_level =
{
    DDF_RAID0: 0x00,
    DDF_RAID1: 0x01,
    DDF_RAID3: 0x03,
    DDF_RAID5: 0x05,
    DDF_RAID6: 0x06,
    DDF_RAID1E: 0x11,
    DDF_JBOD: 0x0f,
    DDF_CONCAT: 0x1f,
    DDF_RAID5E: 0x15,
    DDF_RAID5EE: 0x25
};

E.const.ld_state =
{
    MFI_LD_STATE_OFFLINE: 0,
    MFI_LD_STATE_PARTIALLY_DEGRADED: 1,
    MFI_LD_STATE_DEGRADED: 2,
    MFI_LD_STATE_OPTIMAL: 3
};

E.const.pd_state =
{
    MFI_PD_STATE_UNCONFIGURED_GOOD: 0x00,
    MFI_PD_STATE_UNCONFIGURED_BAD: 0x01,
    MFI_PD_STATE_HOT_SPARE: 0x02,
    MFI_PD_STATE_OFFLINE: 0x10,
    MFI_PD_STATE_FAILED: 0x11,
    MFI_PD_STATE_REBUILD: 0x14,
    MFI_PD_STATE_ONLINE: 0x18,
    MFI_PD_STATE_COPYBACK: 0x20,
    MFI_PD_STATE_SYSTEM: 0x40,
    MFI_PD_STATE_JBOD: 0x40
};

const mfi_ld_ref_v = ref_struct(
{
    target_id: uint8,
    reserved: uint8,
    seq: uint16
});

const mfi_ld_ref = ref_union(
{
    v: mfi_ld_ref_v,
    ld_ref: uint32
});

const mfi_ld_list_entry = ref_struct(
{
    ld: mfi_ld_ref,
    state: uint8,
    reserved: ref_buffer_type(24),
    size: uint64
});

const MFI_MAX_LD = 64;
E.types.mfi_ld_list = ref_struct(
{
    ld_count: uint32,
    reserved: uint32,
    ld_list: ref_array(mfi_ld_list_entry, MFI_MAX_LD)
});

const mfi_ld_props = ref_struct(
{
    ld: mfi_ld_ref,
    name: ref_buffer_type(16),
    default_cache_policy: uint8,
    access_policy: uint8,
    disk_cache_policy: uint8,
    current_cache_policy: uint8,
    no_bgi: uint8,
    reserved: ref_buffer_type(7)
});

const mfi_ld_params = ref_struct(
{
    primary_raid_level: uint8,
    raid_level_qualifier: uint8,
    secondary_raid_level: uint8,
    stripe_size: uint8,
    num_drives: uint8,
    span_depth: uint8,
    state: uint8,
    init_state: uint8,
    is_consistent: uint8,
    reserved: ref_buffer_type(6),
    isSSCD: uint8,
    reserved2: ref_buffer_type(16)
});

const mfi_span = ref_struct(
{
    start_block: uint64,
    num_blocks: uint64,
    array_ref: uint16,
    reserved: ref_buffer_type(6)
});

const MFI_MAX_SPAN_DEPTH = 8;
E.types.mfi_ld_config = ref_struct(
{
    properties: mfi_ld_props,
    params: mfi_ld_params,
    span: ref_array(mfi_span, MFI_MAX_SPAN_DEPTH)
});

const mfi_progress = ref_struct(
{
    progress: uint16,
    elapsed_seconds: uint16
});

const mfi_ld_progress = ref_struct(
{
    active: uint32,
    cc: mfi_progress,
    bgi: mfi_progress,
    fgi: mfi_progress,
    recon: mfi_progress,
    reserved: ref_array(mfi_progress, 4)
});

E.types.mfi_ld_info = ref_struct(
{
    ld_config: E.types.mfi_ld_config,
    size: uint64,
    progress: mfi_ld_progress,
    cluster_owner: uint16,
    reconstruct_active: uint8,
    reserved: uint8,
    vpd_page83: ref_buffer_type(64),
    reserved2: ref_buffer_type(16)
});

const mfi_array_pd_entry_encl = ref_struct(
{
    pd: uint8,
    slot: uint8
});

const mfi_pd_ref_v = ref_struct(
{
    device_id: uint8,
    seq: uint16
});

const mfi_pd_ref = ref_union(
{
    v: mfi_pd_ref_v,
    pd_ref: uint32
});

const mfi_array_pd_entry = ref_struct(
{
    pd_ref: mfi_pd_ref,
    fw_state: uint16,
    encl: mfi_array_pd_entry_encl
});

const MFI_MAX_ROW_SIZE = 32;
E.types.mfi_array = ref_struct(
{
    size: uint64,
    num_drives: uint8,
    reserved: uint8,
    array_ref: uint16,
    pad: ref_buffer_type(20),
    pd: ref_array(mfi_array_pd_entry, MFI_MAX_ROW_SIZE)
});

const MFI_MAX_ARRAYS = 16;
E.types.mfi_spare = ref_struct(
{
    pd_ref: mfi_pd_ref,
    spare_type: uint8,
    reserved: uint16,
    array_count: uint8,
    array_ref: ref_array(uint16, MFI_MAX_ARRAYS)
});

E.types.mfi_config_data = ref_struct(
{
    size: uint32,
    array_count: uint16,
    array_size: uint16,
    log_drv_count: uint16,
    log_drv_size: uint16,
    spares_count: uint16,
    spares_size: uint16,
    reserved: ref_buffer_type(16)
    /*
        followed by array of mfi_array
        followed by array of mfi_ld_config
        followed by array of mfi_spare
     */
});

const mfi_pd_info_path_info = ref_struct(
{
    count: uint8,
    is_path_broken: uint8,
    reserved: ref_buffer_type(6),
    sas_addr: ref_array(uint64, 4)
});

const mfi_pd_ddf_type_ddf = ref_struct(
{
    // XXX: bitfield, may be i should use ref-bitfield in case i will need this flags
    type: uint16,
    reserved: uint16
});

const mfi_pd_ddf_type_non_disk = ref_struct(
{
    reserved: uint32
});

const mfi_pd_ddf_type = ref_union(
{
    ddf: mfi_pd_ddf_type_ddf,
    non_disk: mfi_pd_ddf_type_non_disk,
    type: uint32
});

const mfi_pd_progress = ref_struct(
{
    active: uint32,
    rbld: mfi_progress,
    patrol: mfi_progress,
    clear: mfi_progress,
    reserved: ref_array(mfi_progress, 4)
});

E.types.mfi_pd_info = ref_struct(
{
    pd_ref: mfi_pd_ref,
    inquiry_data: ref_buffer_type(96),
    vpd_page83: ref_buffer_type(64),
    unknown: uint8,
    scsi_dev_type: uint8,
    connected_port_bitmap: uint8,
    device_speed: uint8,
    media_err_count: uint32,
    other_err_count: uint32,
    pred_fail_count: uint32,
    last_pred_fail_event_seq_num: uint32,
    fw_state: uint16,
    disabled_for_removal: uint8,
    link_speed: uint8,
    state: mfi_pd_ddf_type,
    path_info: mfi_pd_info_path_info,
    raw_size: uint64,
    non_coerced_size: uint64,
    coerced_size: uint64,
    encl_device_id: uint16,
    encl_index: uint8,
    slot_number: uint8,
    prog_info: mfi_pd_progress,
    bad_block_table_full: uint8,
    unusable_in_current_config: uint8,
    vpd_page83_ext: ref_buffer_type(64),
    reserved: ref_buffer_type(154)
});

module.exports = E;
