const win_ioctl = require('win_ioctl');
const winston = require('winston');
const ref = require('ref');
const ref_struct = require('ref-struct');
const ref_buffer_type = require('../ref-buffer-type.js');
const mr_frame = require('../megaraid/frame.js');
const mr_data = require('../megaraid/data.js');

let E = {};

const IOCTL_SCSI_MINIPORT = 0x0004d008;

const uint32 = ref.types.uint32;
const Packet = ref_struct({
  hdr_size: uint32,
  magic: ref_buffer_type(8),
  unknown1: uint32,
  unknown2: uint32,
  reserved: uint32, // always 0
  outputSize: uint32
  // frame
});

const PACKET_HDR_SIZE = 28;
const PACKET_OUTPUT_DATA_OFFSET = 188;
const PACKET_MAGIC = 'LSILOGIC';

E.send_packet = (fd, frame, unknown1 = 0, unknown2 = 0) => {
  // console.log(frame);
  if (frame.hdr.cmd == mr_frame.const.FRAME_CMD.MFI_CMD_DCMD)
    winston.verbose('send_packet, cmd = 0x' + frame.opcode.toString(16));
  let packet = new Packet();
  packet.hdr_size = PACKET_HDR_SIZE;
  packet.magic = PACKET_MAGIC;
  packet.unknown1 = unknown1;
  packet.unknown2 = unknown2;
  packet.reserved = 0;
  let outSize = frame.hdr.data_len + PACKET_OUTPUT_DATA_OFFSET;
  packet.outputSize = outSize - PACKET_HDR_SIZE;
  return new Promise((resolve, reject) => win_ioctl(fd, IOCTL_SCSI_MINIPORT, Buffer.concat([packet.ref(), frame.ref()]), outSize, (err, data) => {
    if (err) {
      winston.debug('ioctl error: '+err.message);
      return reject(err);
    }

    let outPacket = ref.get(data, 0, Packet);
    let outFrameHdr = ref.get(data, Packet.size, mr_frame.types.FrameHeader);

    if (outPacket.magic.readDoubleBE() != 0) {
      winston.debug('Incorrect format of packet from drive');
      return reject(new Error('Invalid output packet'));
    }

    let cmd_status = outFrameHdr.cmd_status;
    if (cmd_status != 0) {
      winston.debug('Command executed with error ' + mr_data.const.mfi_status[cmd_status]);
      return reject(new Error('Command execution error, err = ' + mr_data.const.mfi_status[cmd_status]));
    }
    resolve(data.slice(PACKET_OUTPUT_DATA_OFFSET));
  }));
};

module.exports = E;
