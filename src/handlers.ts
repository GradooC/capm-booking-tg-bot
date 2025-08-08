import TelegramBot, { type Message } from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { pollUrls } from "./check-url";
import { pollingManager } from "./polling-state";
import { monitoredUrls } from "./urls";
import { logger } from "./logger";
import { createReadStream } from "fs";


/**
 * Enum for bot message texts
 */
export enum MessageText {
    Start = "🟢 Start",
    Stop = "🔴 Stop",
    Logs = "📝 Get Logs",
}

/**
 * Handles /start command
 */
export async function startHandler(msg: Message, bot: TelegramBot): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message = `🟢 Мониторинг запущен!\nИнтервал проверки: ${
        CONFIG.checkInterval / 1000
    } сек`;

    pollingManager.setActive(true);
    logger.info("🟢 Monitoring started");

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: MessageText.Stop,
                    },
                ],
                [
                    {
                        text: MessageText.Logs,
                    },
                ],
            ],
            resize_keyboard: true,
        },
    });
    pollUrls(monitoredUrls, { bot, chatId });
}

/**
 * Handles /stop command
 */
export async function stopHandler(msg: Message, bot: TelegramBot): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message = "🔴 Мониторинг остановлен!";

    pollingManager.setActive(false);
    logger.info("🔴 Monitoring stopped");

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: MessageText.Start,
                    },
                ],
                [
                    {
                        text: MessageText.Logs,
                    },
                ],
            ],
            resize_keyboard: true,
        },
    });
}

/**
 * Handles logs request
 */
export async function getLogsHandler(msg: Message, bot: TelegramBot): Promise<void> {
    const chatId = msg.chat.id.toString();
    await bot.sendDocument(chatId, createReadStream(CONFIG.logPath));
    logger.info("📝 Logs sent");
}


/**
 * Handles generic message events
 */
export function messageHandler(msg: Message, bot: TelegramBot): void {
    const text = msg.text;
    switch (text) {
        case MessageText.Stop:
            stopHandler(msg, bot);
            break;
        case MessageText.Start:
            startHandler(msg, bot);
            break;
        case MessageText.Logs:
            getLogsHandler(msg, bot);
            break;
        default:
            break;
    }
}
