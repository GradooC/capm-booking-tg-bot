import TelegramBot, { type Message } from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { pollUrls } from "./check-url";
import { pollingManager } from "./polling-state";
import { monitoredUrls } from "./urls";
import { logger } from "./logger";

enum MessageText {
    Start = "🟢 Start",
    Stop = "🔴 Stop",
}

export async function startHandler(msg: Message, bot: TelegramBot) {
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
            ],
            resize_keyboard: true,
        },
    });
    pollUrls(monitoredUrls, { bot, chatId });
}

export async function stopHandler(msg: Message, bot: TelegramBot) {
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
            ],
            resize_keyboard: true,
        },
    });
}

export function messageHandler(msg: Message, bot: TelegramBot) {
    const chatId = msg.chat.id;
    const text = msg.text;

    switch (text) {
        case MessageText.Stop:
            stopHandler(msg, bot);
            break;
        case MessageText.Start:
            startHandler(msg, bot);
            break;
        default:
            break;
    }
}
