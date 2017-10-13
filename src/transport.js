// include os-specific transport
const _transport = require('./transport-win.js');

let E = {};

// return array of internal indexes of drives
E.list_drives = _transport.list_drives.bind(_transport);

E.check_requirments = _transport.check_requirments.bind(_transport);

module.exports = E;
