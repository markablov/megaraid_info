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

E.const.state =
{
    MFI_LD_STATE_OFFLINE: 0,
    MFI_LD_STATE_PARTIALLY_DEGRADED: 1,
    MFI_LD_STATE_DEGRADED: 2,
    MFI_LD_STATE_OPTIMAL: 3
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
const mfi_ld_config = ref_struct(
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
    ld_config: mfi_ld_config,
    size: uint64,
    progress: mfi_ld_progress,
    cluster_owner: uint16,
    reconstruct_active: uint8,
    reserved: uint8,
    vpd_page83: ref_buffer_type(64),
    reserved2: ref_buffer_type(16)
});

module.exports = E;
