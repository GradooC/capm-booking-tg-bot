import TelegramBot, { type Message } from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { createReadStream } from "fs";
import { Db } from "./db";
import { pollUrls } from "./check-url";
import { monitoredUrls } from "./urls";

/**
 * Enum for bot message texts
 */
export enum MessageText {
    Start = "🟢 Start",
    Stop = "🔴 Stop",
    Logs = "📝 Get Logs",
}

type HandlerArgs = {
    msg: Message;
    bot: TelegramBot;
    db: Db;
};

export async function startHandler({ bot, msg, db }: HandlerArgs) {
    await db.addChatId(msg.chat.id);
    logger.info({ chatId: msg.chat.id }, "💬 New chat id added");

    bot.sendMessage(
        msg.chat.id,
        "👋 Привет! Я бот для мониторинга стоянок. Используй команды ниже для управления мониторингом.",
        {
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
        }
    );
}

/**
 * Handles /start command
 */
export async function startPollingHandler({ msg, bot, db }: HandlerArgs) {
    if (db.state.isPollingOn) {
        bot.sendMessage(msg.chat.id, "🟢 Мониторинг уже запущен!");
        return;
    }

    const { chatIds } = db.state;
    const message = `🟢 Мониторинг запущен!\nИнтервал проверки: ${
        CONFIG.checkInterval / 1000
    } сек`;
    logger.info("🟢 Monitoring started");

    await db.startPolling();

    chatIds.forEach((chatId) => {
        bot.sendMessage(chatId, message, {
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
    });

    pollUrls({ monitoredUrls, bot, db });
}

/**
 * Handles /stop command
 */
export async function stopPollingHandler({ msg, bot, db }: HandlerArgs) {
    if (!db.state.isPollingOn) {
        bot.sendMessage(msg.chat.id, "🔴 Мониторинг уже остановлен!");
        return;
    }

    const { chatIds } = db.state;
    await db.stopPolling();

    logger.info("🔴 Monitoring stopped");
    const message = "🔴 Мониторинг остановлен!";

    chatIds.forEach((chatId) => {
        bot.sendMessage(chatId, message, {
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
    });
}

/**
 * Handles logs request
 */
export async function getLogsHandler({ msg, bot }: HandlerArgs) {
    const chatId = msg.chat.id;
    await bot.sendDocument(chatId, createReadStream(CONFIG.logPath));
    logger.info(`📝 Logs sent to chat ${chatId}`);
}

/**
 * Handles generic message events
 */
export function messageHandler(args: HandlerArgs) {
    const text = args.msg.text;
    switch (text) {
        case MessageText.Stop:
            stopPollingHandler(args);
            break;
        case MessageText.Start:
            startPollingHandler(args);
            break;
        case MessageText.Logs:
            getLogsHandler(args);
            break;
        default:
            break;
    }
}
