import axios from 'axios';
import { CONFIG } from './config';
import { handlePollingError } from './error';
import { logger } from './logger';
import { sendSuccessNotification } from './notifications';
import { MonitoredUrl } from './types';
import TelegramBot from 'node-telegram-bot-api';
import { Db } from './db';

type PollUrlsOptions = {
    monitoredUrl: MonitoredUrl;
    bot: TelegramBot;
    db: Db;
};

export function pollCampingUrl({ monitoredUrl, db, bot }: PollUrlsOptions) {
    const { url, name, payload } = monitoredUrl;
    const { value } = payload.selectedCamping;
    const { chatIds } = db.state;

    return new Promise((resolve) => {
        const poll = async () => {
            try {
                const { data } = await axios.post(url, payload, {
                    timeout: CONFIG.timeout,
                    headers: { 'Content-Type': 'application/json' },
                });

                if (data.isSuccess) {
                    logger.info(`✅ Success response received from ${name}`);

                    await db.stopPollingByCampValue(value);

                    const promises = chatIds.map((chatId) =>
                        sendSuccessNotification(bot, chatId, name),
                    );

                    await Promise.allSettled(promises);

                    return resolve({
                        url,
                        data,
                        success: true,
                    });
                }

                logger.info(data, `⏳ Polling ${name} - waiting for success response...`);
            } catch (error) {
                handlePollingError(error, name);
            }

            if (db.isPollingActive(value)) {
                setTimeout(poll, CONFIG.checkInterval);
            }
        };

        poll();
    });
}
