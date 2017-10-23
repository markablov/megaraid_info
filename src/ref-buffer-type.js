var ref = require('ref');

module.exports = BufferType;

/**
 * Fixed length "Buffer" type, for use in Struct type definitions.
 *
 * Optionally setting the `encoding` param will force to call
 * `toString(encoding)` on the buffer returning a String instead.
 */

function BufferType (length, encoding) {
    if (!(this instanceof BufferType)) return new BufferType(length);
    this.size = length | 0;
    this.encoding = encoding || null;
}
BufferType.prototype = Object.create(ref.types.byte, {
    constructor: {
        value: BufferType,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

BufferType.prototype.get = function (buffer, offset) {
    var buf = buffer.slice(offset, offset + this.size);
    if (this.encoding !== null) {
        buf = buf.toString(this.encoding);
    }
    return buf;
};

BufferType.prototype.set = function (buffer, offset, value) {
    if ('string' === typeof value || Array.isArray(value)) {
        value = new Buffer(value, this.encoding);
    } else if (!Buffer.isBuffer(value)) {
        throw new TypeError('Buffer instance expected');
    }

    if (value.length > this.size) {
        throw new Error('Buffer given is ' + value.length + ' bytes, but only '
            + this.size + ' bytes available');
    }

    value.copy(buffer, offset);
};