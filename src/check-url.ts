import axios, { isAxiosError } from 'axios';
import { MonitoredUrl } from './types';
import TelegramBot from 'node-telegram-bot-api';

export async function pollUrls(urlArray: MonitoredUrl[], interval = 1000) {
    // Create a promise for each URL that will resolve when it gets {isSuccess: true}
    const pollingPromises = urlArray.map(({ url, name, payload }) => {
        return new Promise((resolve) => {
            let isPolling = true;

            const poll = async () => {
                if (!isPolling) return;

                try {
                    const response = await axios.post(url, payload, {
                        timeout: 10000, // 10 second timeout
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    // Check if we got the success response
                    if (response.data.isSuccess) {
                        console.log(
                            `✅ Success response received from ${name}`
                        );
                        isPolling = false;
                        resolve({ url, success: true, data: response.data });
                        return;
                    }

                    console.log(
                        `⏳ Polling ${name} - waiting for success response...`
                    );
                } catch (error) {
                    // Handle timeout and other errors without throwing
                    if (isAxiosError(error)) {
                        switch (true) {
                            case error.code === 'ECONNABORTED':
                            case error.message.includes('timeout'):
                                console.log(
                                    `⏰ Request timeout for ${name} (10s) - continuing to poll...`
                                );
                                break;
                            case Boolean(error.response):
                                // Server responded with error status
                                console.log(
                                    `❌ Server error for ${name} (${error.response?.status}) - continuing to poll...`
                                );
                                break;
                            case Boolean(error.request):
                                // Network error
                                console.log(
                                    `🌐 Network error for ${name} - continuing to poll...`
                                );
                                break;
                            default:
                                console.log(
                                    `❌ Error polling ${name}:`,
                                    error.message,
                                    '- continuing to poll...'
                                );
                                break;
                        }
                    } else {
                        console.log(
                            `❌ Unexpected error polling ${name}:`,
                            error
                        );
                    }
                }

                // Schedule next poll if still polling
                if (isPolling) {
                    setTimeout(poll, interval);
                }
            };

            // Start polling immediately
            poll();
        });
    });

    // Wait for all URLs to complete
    const results = await Promise.all(pollingPromises);
    console.log('🎉 All URLs have returned success responses!');
    return results;
}

async function sendSuccessNotification(bot: TelegramBot, chatId: string) {
    const message = `
🎉 УСПЕХ!

Время: ${new Date().toLocaleString('ru-RU')}
Результат: стоянка успешно забронирована!
    `;

    try {
        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
    }
}
