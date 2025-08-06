import axios, { isAxiosError } from "axios";
import { MonitoredUrl } from "./types";
import TelegramBot from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { pollingManager } from "./polling-state";

type PollUrlsOptions = {
    bot: TelegramBot;
    chatId: string;
};

export async function pollUrls(
    urlArray: MonitoredUrl[],
    { bot, chatId }: PollUrlsOptions
) {
    // Create a promise for each URL that will resolve when it gets {isSuccess: true}
    const pollingPromises = urlArray.map(({ url, name, payload }) => {
        return new Promise((resolve) => {
            let isPolling = true;

            const poll = async () => {
                if (!isPolling || !pollingManager.isActive()) return;

                try {
                    const response = await axios.post(url, payload, {
                        timeout: 10000, // 10 second timeout
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    // Check if we got the success response
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
                        `⏳ Polling ${name} - waiting for success response...`
                    );
                } catch (error) {
                    // Handle timeout and other errors without throwing
                    if (isAxiosError(error)) {
                        switch (true) {
                            case error.code === "ECONNABORTED":
                            case error.message.includes("timeout"):
                                logger.warn(
                                    `⏰ Request timeout for ${name} (10s) - continuing to poll...`
                                );
                                break;
                            case Boolean(error.response):
                                // Server responded with error status

                                logger.warn(
                                    `❌ Server error for ${name} (${error.response?.status}) - continuing to poll...`
                                );
                                break;
                            case Boolean(error.request):
                                // Network error
                                logger.warn(
                                    `🌐 Network error for ${name} - continuing to poll...`
                                );
                                break;
                            default:
                                logger.warn(
                                    `❌ Error polling ${name}:`,
                                    error.message,
                                    "- continuing to poll..."
                                );
                                break;
                        }
                    } else {
                        logger.error(
                            `❌ Unexpected error polling ${name}:`,
                            error
                        );
                    }
                }

                // Schedule next poll if still polling
                if (isPolling) {
                    setTimeout(poll, CONFIG.checkInterval);
                }
            };

            // Start polling immediately
            poll();
        });
    });

    // Wait for all URLs to complete
    await Promise.all(pollingPromises);
    logger.info("🎉 All URLs have returned success responses!");
}

async function sendSuccessNotification(
    bot: TelegramBot,
    chatId: string,
    name: string
) {
    const message = `
🎉 УСПЕХ!

Время: ${new Date().toLocaleString("ru-RU")}
Результат: стоянка ${name} успешно забронирована!
    `;

    try {
        await bot.sendMessage(chatId, message);
    } catch (error) {
        logger.error("Ошибка отправки сообщения:", error);
    }
}
