import winston from 'winston';

import { Config } from './config';

const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    const extraData = { ...metadata };
    delete extraData.service;

    // Check if there are additional metadata fields
    const hasExtraData = Object.keys(extraData).length > 0;

    return JSON.stringify({
        timestamp,
        level,
        message,
        ...(hasExtraData ? { data: extraData } : {}),
        service: metadata.service,
    });
});

const logger = winston.createLogger({
    level: Config.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json(), customFormat),
    defaultMeta: { service: 'fraud-shield', environment: Config.nodeEnv },
    transports: [new winston.transports.Console()],
});

const enhancedLogger = {
    log: (message: string, data?: any) => {
        if (data) {
            logger.info(message, data);
        } else {
            logger.info(message);
        }
    },
    info: (message: string, data?: any) => {
        if (data) {
            logger.info(message, data);
        } else {
            logger.info(message);
        }
    },
    debug: (message: string, data?: any) => {
        if (data) {
            logger.debug(message, data);
        } else {
            logger.debug(message);
        }
    },
    error: (message: string, data?: any) => {
        if (data) {
            logger.error(message, data);
        } else {
            logger.error(message);
        }
    },
    warn: (message: string, data?: any) => {
        if (data) {
            logger.warn(message, data);
        } else {
            logger.warn(message);
        }
    },
};

export { enhancedLogger as logger };
