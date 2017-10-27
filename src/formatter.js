const pretty = require('prettysize');

let E = {};

E.print_config = cfg =>
{
    console.log(cfg);
};

E.print_volumes = volumes =>
{
    for (let idx in volumes)
    {
        let vol = volumes[idx];
        console.log(`#${idx}:`);
        console.log('  Name: ' + vol.name);
        console.log('  State: ' + vol.state);
        console.log('  Size: ' + pretty(vol.size));
        console.log('  RAID Level: ' + vol.raid_level);
        console.log('  Drive count: ' + vol.num_drives);
        console.log('  Stripe size: ' + pretty(vol.stripe));
    }
};

module.exports = E;
