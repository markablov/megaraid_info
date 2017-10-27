const fs = require('fs');
const is_admin = require('is-admin');
const winston = require('winston');

const transport = require('./transport.js');
const mr_frame = require('../megaraid/frame.js');

let E = {};

let openAsync = idx => new Promise((resolve) =>
    fs.open(`\\\\.\\scsi${idx}:`, 'r+', (err, fd) => resolve(fd ? [idx, fd] : err)));

E.open_controller = drive =>
    openAsync(drive).then(res => Array.isArray(res) ? res[1] : Promise.reject(res));

// returns promise that resolves with drive index in case of success and null otherwise
// should close fd
const check_controller = drive =>
{
    let [idx, fd] = drive;
    winston.verbose('Examing drive #'+idx);
    return transport.send_packet(fd, mr_frame.build_dcmd_frame(...mr_frame.const.DCMD.CHECK), 0, 0xf0020000)
        .then(() => (fs.closeSync(fd), idx))
        .catch(() => (fs.closeSync(fd), null));
};

E.list_controllers = () => Promise.all([...Array(250).keys()].map(x => openAsync(x)))
    .then(drives => drives.filter(x => Array.isArray(x)))
    .then(drives => Promise.all(drives.map(x => check_controller(x))))
    .then(drives => drives.filter(x => x !== null));

E.check_requirements = () =>
    is_admin().then(admin => admin ? Promise.resolve() : Promise.reject(new Error('Script should be run with admin rights!')));

module.exports = E;
