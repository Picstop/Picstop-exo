import winston, { Logger } from 'winston';
import path from 'path';

/**
 * Returns a new Winston logger with global configs or default.
 * @param {string} uid The unique id for the logger.
 * @param {string} filename The filename for the log, defaults to 'default
 * @return {winston.Logger} The logger object.
 */
function initLogger(uid: string, filename: string = 'default'): Logger {
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
            filename: process.env.LOG_FILE_PATH || `${path.dirname(require.main.filename)}/logs/${filename}.log`,
        }),
    );

    return logger;
}

export default initLogger;
