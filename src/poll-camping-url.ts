import axios from "axios";
import { CONFIG } from "./config";
import { handlePollingError } from "./error";
import { logger } from "./logger";
import { sendSuccessNotification } from "./notifications";
import { MonitoredUrl } from "./types";
import TelegramBot from "node-telegram-bot-api";
import { Db } from "./db";

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
            if (!db.isPollingActive(value)) return;

            try {
                const response = await axios.post(url, payload, {
                    timeout: 10000,
                    headers: { "Content-Type": "application/json" },
                });

                if (response.data.isSuccess) {
                    logger.info(`✅ Success response received from ${name}`);

                    await db.stopPollingByCampValue(value);

                    chatIds.forEach((chatId) => {
                        sendSuccessNotification(bot, chatId, name);
                    });

                    return resolve({
                        url,
                        success: true,
                        data: response.data,
                    });
                }

                logger.info(
                    response.data,
                    `⏳ Polling ${name} - waiting for success response...`
                );
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
