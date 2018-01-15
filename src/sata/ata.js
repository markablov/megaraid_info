const cmd = {
  ATA_IDENTIFY_DEVICE: 0xEC
};

class ATADrive {
  constructor(transport) {
    this._transport = transport;
  }

  async identify() {
    const swap = s => s.split('').map((x, i, a) => i % 2 ? '' : ((a[i + 1] || '') + x)).join('');

    let res = await this._transport.send({
      outRegs: [],
      type: 'read',
      regs: {
        features: 0,
        sectorCount: 1,
        LBALow: 0,
        LBAMid: 0,
        LBAHigh: 0,
        device: 0,
        command: cmd.ATA_IDENTIFY_DEVICE
      },
      outSize: 512
    });

    return {
      serial: swap(res.slice(20, 40).toString().trim()),
      model: swap(res.slice(54, 94).toString().trim())
    };
  }
}

module.exports = ATADrive;
