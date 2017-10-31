const detector = require('./windows/detector.js');
const Controller = require('./controller.js');
const formatter = require('./formatter.js');
const winston = require('winston');

// XXX: configure debug level through arguments
winston.configure(
{
    level: 'debug',
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
        formatter.print_config(await ctrl.config());
        // formatter.print_volumes(await ctrl.volumes());
    } catch (err)
    {
        winston.error(err.message);
    }
})();
