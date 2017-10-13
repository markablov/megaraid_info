const fs = require('fs');
const isAdmin = require('is-admin');

let E = {_drives: {}};

E.check_requirments = () =>
    isAdmin().then(admin => admin ? Promise.resolve() : Promise.reject('Script should be run with admin rights!'));

const check_drive = drive =>
{
    [idx, fd] = drive;
    console.log('Examing drive #'+idx);
    return true;
};

E.list_drives = () =>
{
    let openAsync = idx => new Promise((resolve, reject) =>
        fs.open(`\\\\.\\scsi${idx}:`, 'r+', (err, fd) => resolve(fd ? [idx, fd] : null)));
    return Promise.all([...Array(250).keys()].map(x => openAsync(x)))
        .then(drives => drives.filter(x => !!x && check_drive(x)))
        .then(drives => E._drives = Object.assign(...drives.map(x => ({[x[0]]: x[1]}))))
        .then(drives => Object.keys(drives));
};

module.exports = E;
