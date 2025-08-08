import axios, { isAxiosError } from "axios";
import { MonitoredUrl } from "./types";
import TelegramBot from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { sendSuccessNotification } from "./notifications";
import { Db } from "./db";
import { handlePollingError } from "./error";

/**
 * Options for polling URLs
 */
type PollUrlsOptions = {
    monitoredUrls: MonitoredUrl[];
    bot: TelegramBot;
    db: Db;
};

/**
 * Polls all monitored URLs until success response is received
 */
export async function pollUrls({ monitoredUrls, bot, db }: PollUrlsOptions) {
    const pollingPromises = monitoredUrls.map(({ url, name, payload }) => {
        const { value } = payload.selectedCamping;
        const { chatIds } = db.state;

        return new Promise(async (resolve) => {
            const poll = async () => {
                if (!db.isPollingActive(value)) return;

                try {
                    const response = await axios.post(url, payload, {
                        timeout: 10000,
                        headers: { "Content-Type": "application/json" },
                    });

                    if (response.data.isSuccess) {
                        logger.info(
                            `✅ Success response received from ${name}`
                        );

                        await db.stopPollingByCampValue(value);

                        resolve({ url, success: true, data: response.data });

                        chatIds.forEach((chatId) => {
                            sendSuccessNotification(bot, chatId, name);
                        });

                        return;
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
    });

    await Promise.all(pollingPromises);
    logger.info("🎉 All URLs have returned success responses!");
}
