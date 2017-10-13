const fs = require('fs');

const transport = require('./transport.js');
const megaraid = require('./megaraid.js');

(async function(){
    try
    {
        await transport.check_requirments();
        let drives = await transport.list_drives();
        console.log(drives);
    } catch (err)
    {
        console.log(err);
    }
})();
