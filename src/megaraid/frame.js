const ref = require('ref');
const ref_buffer_type = require('../ref-buffer-type.js');
const ref_struct = require('ref-struct');
const mr_data = require('./data.js');

let E = {const: {}, types: {}};

E.const.FRAME_FLAGS =
{
    MFI_FRAME_POST_IN_REPLY_QUEUE: 0x0000,
    MFI_FRAME_DONT_POST_IN_REPLY_QUEUE: 0x0001,
    MFI_FRAME_SGL32: 0x0000,
    MFI_FRAME_SGL64: 0x0002,
    MFI_FRAME_SENSE32: 0x0000,
    MFI_FRAME_SENSE64: 0x0004,
    MFI_FRAME_DIR_NONE: 0x0000,
    MFI_FRAME_DIR_WRITE: 0x0008,
    MFI_FRAME_DIR_READ: 0x0010,
    MFI_FRAME_DIR_BOTH: 0x0018,
    MFI_FRAME_IEEE_SGL: 0x0020,
};

E.const.FRAME_CMD =
{
    MFI_CMD_INIT: 0x00,
    MFI_CMD_LD_READ: 0x01,
    MFI_CMD_LD_WRITE: 0x02,
    MFI_CMD_LD_SCSI_IO: 0x03,
    MFI_CMD_PD_SCSI_IO: 0x04,
    MFI_CMD_DCMD: 0x05,
    MFI_CMD_ABORT: 0x06,
    MFI_CMD_SMP: 0x07,
    MFI_CMD_STP: 0x08
};

E.const.DCMD =
{
    CHECK: [0xf0020300, 4],
    PD_GET_INFO: [0x02020000, mr_data.types.mfi_pd_info.size],
    LD_GET_LIST: [0x03010000, mr_data.types.mfi_ld_list.size],
    LD_GET_INFO: [0x03020000, mr_data.types.mfi_ld_info.size],
    CFG_READ: [0x04010000, mr_data.types.mfi_config_data.size]
};

const uint8 = ref.types.uint8;
const uint16 = ref.types.uint16;
const uint32 = ref.types.uint32;

const FrameHeader = ref_struct(
{
    /* 0x00 */ cmd: uint8,
    /* 0x01 */ sense_len: uint8,
    /* 0x02 */ cmd_status: uint8,
    /* 0x03 */ scsi_status: uint8,
    /* 0x04 */ target_id: uint8,
    /* 0x05 */ lun_id: uint8,
    /* 0x06 */ cdb_len: uint8,
    /* 0x07 */ sg_count: uint8,
    /* 0x08 */ context: uint32,
    /* 0x0C */ pad0: uint32,
    /* 0x10 */ flags: uint16,
    /* 0x12 */ timeout: uint16,
    /* 0x14 */ data_len: uint32,
});

const MFI_MBOX_SIZE = 12;

const DCMDFrame = E.types.DCMDFrame = ref_struct(
{
    /* 0x00 */ hdr: FrameHeader,
    /* 0x18 */ opcode: uint32,
    /* 0x1C */ mbox: ref_buffer_type(MFI_MBOX_SIZE), // additional arguments for command
    /* 0x28 */
    // here should be sgl union that contains address and size for fast DMA data transfer
    // between device and CPU but at Windows StorCLI just wrote here pointer inside output buffer
    // and driver anyway returns data does not matter if sgl present or not
    // even if i decide to fill sgl, it should be done by transport layer
});

E.build_dcmd_frame = (opcode, outSize, mbox, inSize = 0) =>
{
    let frame = new DCMDFrame(), hdr = frame.hdr;
    hdr.cmd = E.const.FRAME_CMD.MFI_CMD_DCMD;
    hdr.sense_len = 0;
    hdr.cmd_status = 0xFF;
    hdr.scsi_status = 0;
    // XXX: need to support multiply devices through one controller
    hdr.target_id = 0;
    hdr.lun_id = 0;
    hdr.cdb_len = inSize;
    hdr.sg_count = 0;
    hdr.context = 0;
    hdr.pad0 = 0;
    hdr.flags = outSize ? (inSize ? E.const.FRAME_FLAGS.MFI_FRAME_DIR_BOTH : E.const.FRAME_FLAGS.MFI_FRAME_DIR_READ) :
        (inSize ? E.const.FRAME_FLAGS.MFI_FRAME_DIR_WRITE : E.const.FRAME_FLAGS.MFI_FRAME_DIR_NONE);
    hdr.timeout = 0;
    hdr.data_len = outSize;
    frame.opcode = opcode;
    if (mbox)
        frame.mbox = mbox;
    return frame;
};

module.exports = E;
