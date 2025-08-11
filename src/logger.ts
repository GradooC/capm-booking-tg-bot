import pino from 'pino';
import { CONFIG } from './config';

const transport = pino.transport({
    targets: [
        {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
        {
            target: 'pino-pretty',
            options: {
                colorize: false,
                destination: CONFIG.logPath,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    ],
});

export const logger = pino({}, transport);
