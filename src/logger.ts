import path from "path";
import pino from "pino";

const transport = pino.transport({
    targets: [
        {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "yyyy-mm-dd HH:MM:ss",
                ignore: "pid,hostname",
            },
        },
        {
            target: "pino-pretty",
            options: {
                colorize: false,
                destination: path.resolve(__dirname, "../app.log"),
                translateTime: "yyyy-mm-dd HH:MM:ss",
                ignore: "pid,hostname",
            },
        },
    ],
});

export const logger = pino({}, transport);
