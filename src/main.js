const detector = require('./windows/detector.js');
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
        winston.info('List of controllers found: ' + drives.map(x => '#'+x).join(', '));
    } catch (err)
    {
        winston.error(err.message);
    }
})();
