import winston, { Logger } from 'winston';

/**
 * Returns a new Winston logger with global configs or default.
 * @param {string} uid The unique id for the logger.
 * @return {winston.Logger} The logger object.
 */
function init(uid: string): Logger {
    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.label({ label: uid }),
            winston.format.timestamp(),
            winston.format.printf(
                (log) => `${log.timestamp} [${log.label}] (${log.level}): ${log.message}`,
            ),
        ),
    });

    logger.add(
        new winston.transports.File({
            filename: process.env.LOG_FILE || '../logs/default.log',
        }),
    );

    return logger;
}

export default init;
