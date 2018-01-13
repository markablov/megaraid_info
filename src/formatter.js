const pretty = require('prettysize');

let E = {};

E.print_config = cfg => {
  for (let idx in cfg) {
    let ld = cfg[idx];
    console.log(`Volume #${idx} ${ld.state} ${ld.raid_level} ${pretty(ld.size)} ${ld.name}`);
    ld.spans.forEach((x, i) => {
      console.log(`  Span #${i} ${x.num_drives} drives by ${pretty(x.size)}`);
      x.pds.forEach(pd => console.log(`    #${pd.device_id} [${pd.id}] ${pd.state} ${pd.inquiry}`));
    });
  }
};

E.print_volumes = volumes => {
  for (let idx in volumes) {
    let vol = volumes[idx];
    console.log(`#${idx}:`);
    console.log('  Name: '+vol.name);
    console.log('  State: '+vol.state);
    console.log('  Size: '+pretty(vol.size));
    console.log('  RAID Level: '+vol.raid_level);
    console.log('  Drive count: '+vol.num_drives);
    console.log('  Stripe size: '+pretty(vol.stripe));
  }
};

module.exports = E;
