const cmd = {
  INQUIRY: 0x12,
  ATA_PASSTHROUGH_12: 0xA1
};

class SCSIDrive {
  constructor(transport) {
    this._transport = transport;
  }

  async inquiry() {
    let cdb = Buffer.from([cmd.INQUIRY, 0, 0, 0, 36, 0]);
    let buf = await this._transport.send(cdb, 36);
    return {
      vendorId: buf.slice(8, 16).toString().trim(),
      productId: buf.slice(16, 32).toString().trim(),
      productRev: buf.slice(32, 36).toString().trim()
    };
  }

  ataPasstrough(ataCmd) {
    let ck_cond = ataCmd.outRegs && ataCmd.outRegs.length > 0 ? 1 : 0;
    let protocol = 3, t_dir = 1, t_len = 0;

    if (ataCmd.type == 'read') {
      protocol = 4;
      t_len = 2;
    } else if (ataCmd.type == 'write') {
      protocol = 5;
      t_len = 2;
      t_dir = 0;
    }

    let cdb = Buffer.from([
      cmd.ATA_PASSTHROUGH_12,
      protocol << 1,
      (ck_cond << 5) | (t_dir << 3) | 4 | t_len,
      ataCmd.regs.features || 0,
      ataCmd.regs.sectorCount || 0,
      ataCmd.regs.LBALow || 0,
      ataCmd.regs.LBAMid || 0,
      ataCmd.regs.LBAHigh || 0,
      ataCmd.regs.device || 0,
      ataCmd.regs.command,
      0,
      0
    ]);

    return this._transport.send(cdb, ataCmd.outSize);
  }
}

module.exports = SCSIDrive;
