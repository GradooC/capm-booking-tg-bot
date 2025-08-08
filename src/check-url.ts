import axios, { isAxiosError } from "axios";
import { MonitoredUrl } from "./types";
import TelegramBot from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { pollingManager } from "./polling-state";
import { sendSuccessNotification } from "./notifications";

/**
 * Options for polling URLs
 */
type PollUrlsOptions = {
    bot: TelegramBot;
    chatId: string;
};

/**
 * Polls all monitored URLs until success response is received
 */
export async function pollUrls(
    urlArray: MonitoredUrl[],
    { bot, chatId }: PollUrlsOptions
): Promise<void> {
    const pollingPromises = urlArray.map(({ url, name, payload }) => {
        return new Promise((resolve) => {
            let isPolling = true;

            const poll = async () => {
                if (!isPolling || !pollingManager.isActive()) return;

                try {
                    const response = await axios.post(url, payload, {
                        timeout: 10000,
                        headers: { "Content-Type": "application/json" },
                    });
                    if (response.data.isSuccess) {
                        logger.info(
                            `✅ Success response received from ${name}`
                        );
                        isPolling = false;
                        resolve({ url, success: true, data: response.data });
                        sendSuccessNotification(bot, chatId, name);
                        return;
                    }
                    logger.info(
                        response.data,
                        `⏳ Polling ${name} - waiting for success response...`
                    );
                } catch (error) {
                    if (isAxiosError(error)) {
                        if (
                            error.code === "ECONNABORTED" ||
                            error.message.includes("timeout")
                        ) {
                            logger.warn(
                                `⏰ Request timeout for ${name} (10s) - continuing to poll...`
                            );
                        } else if (error.response) {
                            logger.warn(
                                `❌ Server error for ${name} (${error.response?.status}) - continuing to poll...`
                            );
                        } else if (error.request) {
                            logger.warn(
                                `🌐 Network error for ${name} - continuing to poll...`
                            );
                        } else {
                            logger.warn(
                                `❌ Error polling ${name}: ${error.message} - continuing to poll...`
                            );
                        }
                    } else {
                        logger.error(
                            `❌ Unexpected error polling ${name}:`,
                            error
                        );
                    }
                }
                if (isPolling) {
                    setTimeout(poll, CONFIG.checkInterval);
                }
            };

            poll();
        });
    });

    await Promise.all(pollingPromises);
    logger.info("🎉 All URLs have returned success responses!");
}
