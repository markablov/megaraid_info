const ref_struct = require('ref-struct');
const ref_buffer_type = require('../ref-buffer-type.js');
const ref = require('ref');

let E = {types: {}, const: {}};

const uint8 = ref.types.uint8;
const uint16 = ref.types.uint16;

E.sid_type = inq => inq.device & 0x1F;
E.sid_qual = inq => (inq.device & 0xE0) >> 5;
E.sid_qual_is_vendor_unique = inq => !!(E.sid_qual(inq) & 0x04);
E.sid_ansi_rev = inq => inq.version & 0x07;

E.const.qual =
{
    SID_QUAL_LU_CONNECTED: 0x00,
    SID_QUAL_LU_OFFLINE: 0x01,
    SID_QUAL_RSVD: 0x02,
    SID_QUAL_BAD_LU: 0x03
};

E.const.rev =
{
    SCSI_REV_0: 0,
    SCSI_REV_CCS: 1,
    SCSI_REV_2: 2,
    SCSI_REV_SPC: 3,
    SCSI_REV_SPC2: 4,
    SCSI_REV_SPC3: 5,
    SCSI_REV_SPC4: 6,
    SCSI_REV_SPC5: 7
};

E.const.type =
{
    T_DIRECT: 0x00,
    T_SEQUENTIAL: 0x01,
    T_PRINTER: 0x02,
    T_PROCESSOR: 0x03,
    T_WORM: 0x04,
    T_CDROM: 0x05,
    T_SCANNER: 0x06,
    T_OPTICAL : 0x07,
    T_CHANGER: 0x08,
    T_COMM: 0x09,
    T_ASC0x0: 0x0a,
    T_ASC1: 0x0b,
    T_STORARRAY: 0x0c,
    T_ENCLOSURE: 0x0d,
    T_RBC: 0x0e,
    T_OCRW: 0x0f,
    T_OSD: 0x11,
    T_ADC: 0x12,
    T_ZBC_HM: 0x14,
    T_NODEVICE: 0x1f,
    T_ANY: 0xff
};

E.const.SID_VENDOR_SPECIFIC_0_SIZE = 20;

const SID_VENDOR_SIZE = 8;
const SID_PRODUCT_SIZE = 16;
const SID_REVISION_SIZE = 4;
const SID_VENDOR_SPECIFIC_1_SIZE = 160;
E.types.scsi_inquiry_data = ref_struct(
{
    device: uint8,
    qual2: uint8,
    version: uint8,
    response_format: uint8,
    additional_length: uint8,
    spc3_flags: uint8,
    spc2_flags: uint8,
    flags: uint8,
    vendor: ref_buffer_type(SID_VENDOR_SIZE),
    product: ref_buffer_type(SID_PRODUCT_SIZE),
    revision: ref_buffer_type(SID_REVISION_SIZE),
    vendor_specific0: ref_buffer_type(E.const.SID_VENDOR_SPECIFIC_0_SIZE),
    spi3data: uint8,
    reserved2: uint8,
    version1: uint16,
    version2: uint16,
    version3: uint16,
    version4: uint16,
    version5: uint16,
    version6: uint16,
    version7: uint16,
    version8: uint16,
    reserved3: ref_buffer_type(22),
    // XXX: it's optional
    // vendor_specific1: ref_buffer_type(SID_VENDOR_SPECIFIC_1_SIZE)
});

E.format_str = s => s.toString().trim();

module.exports = E;
