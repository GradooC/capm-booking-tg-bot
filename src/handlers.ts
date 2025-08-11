import TelegramBot, { type Message } from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { createReadStream } from "fs";
import { Db } from "./db";
import { monitoredUrls } from "./urls";
import { pollCampingUrl } from "./poll-camping-url";
import { CampValue, valueToNameMap } from "./types";

/**
 * Enum for bot message texts
 */
enum MessageText {
    Start = "🟢 Start",
    Stop = "🔴 Stop",
    Logs = "📝 Get Logs",
    GetStatus = "📊 Get Status",
    ResetCampState = "🔄 Reset Camp State",
}

type HandlerArgs = {
    msg: Message;
    bot: TelegramBot;
    db: Db;
};

const commonButtons = [
    {
        text: MessageText.Logs,
    },
    {
        text: MessageText.GetStatus,
    },
    {
        text: MessageText.ResetCampState,
    },
];

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
                    commonButtons,
                ],
                resize_keyboard: true,
            },
        }
    );
}

/**
 * Handles /start command
 */
async function startPollingHandler({ msg, bot, db }: HandlerArgs) {
    if (db.state.isPollingOn) {
        return bot.sendMessage(msg.chat.id, "🟢 Мониторинг уже запущен!", {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: MessageText.Stop,
                        },
                    ],
                    commonButtons,
                ],
                resize_keyboard: true,
            },
        });
    }

    if (Object.values(db.state.campState).every((state) => !state)) {
        return bot.sendMessage(
            msg.chat.id,
            "🔴 Все стоянки уже забронированы!\nЕсли хотите начать заново - сбросьте состояние бота.",
            {
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: MessageText.Start,
                            },
                        ],
                        commonButtons,
                    ],
                    resize_keyboard: true,
                },
            }
        );
    }

    const { chatIds } = db.state;
    const message = `🟢 Мониторинг запущен!\nИнтервал проверки: ${
        CONFIG.checkInterval / 1000
    } сек`;
    logger.info("🟢 Monitoring started");

    await db.startPolling();

    const startMessagePromises = chatIds.map((chatId) =>
        bot.sendMessage(chatId, message, {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: MessageText.Stop,
                        },
                    ],
                    commonButtons,
                ],
                resize_keyboard: true,
            },
        })
    );

    await Promise.allSettled(startMessagePromises);

    await Promise.allSettled(
        monitoredUrls.map((monitoredUrl) =>
            pollCampingUrl({ monitoredUrl, bot, db })
        )
    );

    const successMessagePromises = chatIds.map((chatId) =>
        bot.sendMessage(chatId, "Все стоянки успешно забронированы ⛺️")
    );

    await Promise.allSettled(successMessagePromises);

    await stopPollingHandler({ msg, bot, db });

    logger.info("🎉 All URLs have returned success responses!");
}

/**
 * Handles /stop command
 */
async function stopPollingHandler({ msg, bot, db }: HandlerArgs) {
    if (!db.state.isPollingOn) {
        bot.sendMessage(msg.chat.id, "🔴 Мониторинг уже остановлен!", {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: MessageText.Start,
                        },
                    ],
                    commonButtons,
                ],
                resize_keyboard: true,
            },
        });
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
                    commonButtons,
                ],
                resize_keyboard: true,
            },
        });
    });
}

/**
 * Handles logs request
 */
async function getLogsHandler({ msg, bot }: HandlerArgs) {
    const chatId = msg.chat.id;
    await bot.sendDocument(chatId, createReadStream(CONFIG.logPath));
    logger.info(`📝 Logs sent to chat ${chatId}`);
}

async function getStatusHandler({ msg, bot, db }: HandlerArgs) {
    const chatId = msg.chat.id;
    const { isPollingOn, campState } = db.state;

    const campInfo = Object.entries(campState)
        .map(
            ([value, state]) =>
                `· ${valueToNameMap[value as CampValue]}: ${
                    state ? "⌛️ В процессе" : "✅ Забронирована"
                }`
        )
        .join("\n");
    const message = `📊 Статус мониторинга:\n\nМониторинг: ${
        isPollingOn ? "🟢 Включен" : "🔴 Остановлен"
    }\n\nСостояние стоянок:\n\n${campInfo}`;

    await bot.sendMessage(chatId, message);
    logger.info(`📊 Status sent to chat ${chatId}`);
}

async function resetCampStateHandler({ msg, bot, db }: HandlerArgs) {
    await db.resetCampState();
    await bot.sendMessage(msg.chat.id, "🔄 Состояние стоянок сброшено!");
    if (db.state.isPollingOn) {
        stopPollingHandler({ msg, bot, db });
    }
    logger.info("🔄 Camp state reset");
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
        case MessageText.GetStatus:
            getStatusHandler(args);
            break;
        case MessageText.ResetCampState:
            resetCampStateHandler(args);
            break;
        default:
            break;
    }
}
