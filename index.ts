import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

interface MonitorConfig {
    url: string;
    chatId: string;
    checkInterval: number; // в миллисекундах
    timeout: number; // таймаут для запроса в миллисекундах
}

interface ApiResponse {
    result: boolean;
}

class TelegramMonitorBot {
    private bot: TelegramBot;
    private config: MonitorConfig;
    private intervalId: NodeJS.Timeout | null = null;
    private lastSuccessTime: Date | null = null;
    private isRunning = false;

    constructor(botToken: string, config: MonitorConfig) {
        this.bot = new TelegramBot(botToken, { polling: true });
        this.config = config;
        this.setupBotCommands();
    }

    private setupBotCommands(): void {
        // Команда для запуска мониторинга
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id.toString();
            this.config.chatId = chatId;

            if (!this.isRunning) {
                this.startMonitoring();
                this.bot.sendMessage(
                    chatId,
                    '🟢 Мониторинг запущен!\n' +
                        `URL: ${this.config.url}\n` +
                        `Интервал проверки: ${
                            this.config.checkInterval / 1000
                        } сек`
                );
            } else {
                this.bot.sendMessage(chatId, '⚠️ Мониторинг уже запущен');
            }
        });

        // Команда для остановки мониторинга
        this.bot.onText(/\/stop/, (msg) => {
            const chatId = msg.chat.id.toString();

            if (this.isRunning) {
                this.stopMonitoring();
                this.bot.sendMessage(chatId, '🔴 Мониторинг остановлен');
            } else {
                this.bot.sendMessage(chatId, '⚠️ Мониторинг не запущен');
            }
        });

        // Команда для получения статуса
        this.bot.onText(/\/status/, (msg) => {
            const chatId = msg.chat.id.toString();
            const status = this.isRunning ? '🟢 Запущен' : '🔴 Остановлен';
            const lastSuccess = this.lastSuccessTime
                ? `Последний успех: ${this.lastSuccessTime.toLocaleString(
                      'ru-RU'
                  )}`
                : 'Успешных ответов пока не было';

            this.bot.sendMessage(
                chatId,
                `Статус мониторинга: ${status}\n` +
                    `URL: ${this.config.url}\n` +
                    `${lastSuccess}`
            );
        });

        // Команда для изменения URL
        this.bot.onText(/\/seturl (.+)/, (msg, match) => {
            const chatId = msg.chat.id.toString();
            if (match && match[1]) {
                this.config.url = match[1];
                this.bot.sendMessage(
                    chatId,
                    `✅ URL изменен на: ${this.config.url}`
                );
            } else {
                this.bot.sendMessage(
                    chatId,
                    '❌ Некорректный URL. Используйте: /seturl <URL>'
                );
            }
        });

        // Команда для изменения интервала
        this.bot.onText(/\/setinterval (\d+)/, (msg, match) => {
            const chatId = msg.chat.id.toString();
            if (match && match[1]) {
                const seconds = parseInt(match[1]);
                if (seconds >= 5) {
                    this.config.checkInterval = seconds * 1000;

                    // Перезапуск мониторинга с новым интервалом
                    if (this.isRunning) {
                        this.stopMonitoring();
                        this.startMonitoring();
                    }

                    this.bot.sendMessage(
                        chatId,
                        `✅ Интервал изменен на: ${seconds} секунд`
                    );
                } else {
                    this.bot.sendMessage(
                        chatId,
                        '❌ Интервал должен быть не менее 5 секунд'
                    );
                }
            } else {
                this.bot.sendMessage(
                    chatId,
                    '❌ Некорректное значение. Используйте: /setinterval <секунды>'
                );
            }
        });

        // Команда помощи
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id.toString();
            const helpText = `
🤖 Команды бота:

/start - Запустить мониторинг
/stop - Остановить мониторинг
/status - Показать текущий статус
/seturl <URL> - Изменить URL для мониторинга
/setinterval <секунды> - Изменить интервал проверки (мин. 5 сек)
/help - Показать эту справку

Бот мониторит указанный URL и отправляет уведомление при успешном бронировании.
      `;
            this.bot.sendMessage(chatId, helpText);
        });
    }

    private async checkUrl(): Promise<void> {
        try {
            const response = await axios.get(this.config.url, {
                timeout: this.config.timeout,
                validateStatus: () => true, // принимаем любой статус код
            });
            console.log('🚀 ~ TelegramMonitorBot ~ checkUrl ~ response:', response);

            // Проверяем, что ответ содержит {result: true}
            if (response.data && response.data.result === true) {
                this.lastSuccessTime = new Date();
                await this.sendSuccessNotification();
            }
        } catch (error) {
            console.log(`Ошибка при проверке URL: ${error}`);
            // Не отправляем уведомления об ошибках, так как они ожидаемы
        }
    }

    private async sendSuccessNotification(): Promise<void> {
        const message = `
🎉 УСПЕХ!

URL: ${this.config.url}
Время: ${new Date().toLocaleString('ru-RU')}
Результат: {result: true}

Адрес теперь доступен и вернул положительный результат!
    `;

        try {
            await this.bot.sendMessage(this.config.chatId, message);
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    }

    public startMonitoring(): void {
        if (this.isRunning) {
            console.log('Мониторинг уже запущен');
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.checkUrl();
        }, this.config.checkInterval);

        console.log(
            `Мониторинг запущен для ${this.config.url} с интервалом ${
                this.config.checkInterval / 1000
            } сек`
        );
    }

    public stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Мониторинг остановлен');
    }

    public getStatus(): {
        isRunning: boolean;
        lastSuccess: Date | null;
        config: MonitorConfig;
    } {
        return {
            isRunning: this.isRunning,
            lastSuccess: this.lastSuccessTime,
            config: this.config,
        };
    }
}

// Конфигурация
const BOT_TOKEN =
    process.env.BOT_TOKEN || '8486085996:AAGIg8wQ3ynLjvcsyNPl-Qd_gltjjNcW_t8';
const MONITOR_CONFIG: MonitorConfig = {
    url: process.env.MONITOR_URL || 'https://example.com/api/check',
    chatId: process.env.CHAT_ID || '', // будет установлен при запуске /start
    checkInterval: parseInt(process.env.CHECK_INTERVAL || '2000'), // 30 секунд по умолчанию
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '10000'), // 10 секунд таймаут
};

// Создание и запуск бота
const monitorBot = new TelegramMonitorBot(BOT_TOKEN, MONITOR_CONFIG);

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('Получен сигнал SIGINT, останавливаем мониторинг...');
    monitorBot.stopMonitoring();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Получен сигнал SIGTERM, останавливаем мониторинг...');
    monitorBot.stopMonitoring();
    process.exit(0);
});

console.log('🤖 Telegram Monitor Bot запущен!');
console.log('Отправьте /start боту для начала мониторинга');

export { TelegramMonitorBot, MonitorConfig };
