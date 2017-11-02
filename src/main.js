const detector = require('./windows/detector.js');
const Controller = require('./controller.js');
const formatter = require('./formatter.js');
const winston = require('winston');

const getopt = require('node-getopt').create(
[
    ['', 'verbose[=LEVEL]', 'LEVEL could be error, warn, info, verbose or debug'],
    ['h' , 'help', 'display this help']
])
.bindHelp('Usage: megaraid_info [config | volumes | smart]\n\n[[OPTIONS]]\n');
const opt = getopt.parseSystem();

if (opt.argv.length > 1)
    getopt.emit('help');
let cmd = opt.argv[0] || 'config';

winston.configure(
{
    level: opt.options.verbose || 'error',
    transports:
    [
        new winston.transports.Console(
        {
            format: winston.format.printf(info => `[${info.level}] ${info.message}`)
        })
    ]
});

(async () =>
{
    try
    {
        await detector.check_requirements();
        let drives = await detector.list_controllers();
        if (!drives.length)
        {
            winston.info('No controllers found.');
            return;
        }
        winston.info('List of controllers found: ' + drives.map(x => '#'+x).join(', '));
        // XXX: support only first controller
        let handle = await detector.open_controller(drives[0]);
        let ctrl = new Controller(handle);
        switch (cmd)
        {
        case 'config':
            formatter.print_config(await ctrl.config());
            break;
        case 'volumes':
            formatter.print_volumes(await ctrl.volumes());
            break;
        default:
            getopt.emit('help');
        }
    } catch (err)
    {
        winston.error(err.message);
    }
})();
