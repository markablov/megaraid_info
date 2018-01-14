const cmd = {
  INQUIRY: 0x12
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

  ataPasstrough() {
    let packet = {};

    return this._transport.send(packet, 0);
  }
}

module.exports = SCSIDrive;
