import TelegramBot, { type Message } from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { createReadStream } from "fs";
import { Db } from "./db";
import { monitoredUrls } from "./urls";
import { pollCampingUrl } from "./poll-camping-url";
import { CampValue, valueToNameMap } from "./types";
import { BOT_COMMANDS, KeyboardLayouts } from "./keyboard-layouts";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

/**
 * Bot response messages
 */
const MESSAGES = {
    WELCOME:
        "👋 Привет! Я бот для мониторинга стоянок. Используй команды ниже для управления мониторингом.",
    MONITORING_STARTED: (interval: number) =>
        `🟢 Мониторинг запущен!\nИнтервал проверки: ${interval} сек`,
    MONITORING_STOPPED: "🔴 Мониторинг остановлен!",
    MONITORING_ALREADY_STARTED: "❇️ Мониторинг уже запущен!",
    MONITORING_ALREADY_STOPPED: "❌ Мониторинг уже остановлен!",
    ALL_CAMPS_BOOKED:
        "❎ Все стоянки уже забронированы!\nЕсли хотите начать заново - сбросьте состояние бота.",
    ALL_CAMPS_SUCCESS: "Все стоянки успешно забронированы 🏕️",
    STATE_RESET: "🔄 Состояние стоянок сброшено!",
} as const;

type HandlerArgs = {
    msg: Message;
    bot: TelegramBot;
    db: Db;
};

type MessageHandler = (args: HandlerArgs) => Promise<void> | void;

/**
 * Service class for sending messages to multiple chats
 */
class NotificationService {
    constructor(private bot: TelegramBot) {}

    async notifyAllChats(
        chatIds: number[],
        message: string,
        options?: TelegramBot.SendMessageOptions
    ) {
        const promises = chatIds.map((chatId) =>
            this.bot
                .sendMessage(chatId, message, options)
                .catch((error) =>
                    logger.warn(
                        { chatId, error: error.message },
                        "Failed to send message to chat"
                    )
                )
        );

        await Promise.allSettled(promises);
    }
}

/**
 * Handler for the initial /start command registration
 */
export async function startHandler({ bot, msg, db }: HandlerArgs) {
    try {
        await db.addChatId(msg.chat.id);
        logger.info({ chatId: msg.chat.id }, "💬 New chat id added");

        await bot.sendMessage(msg.chat.id, MESSAGES.WELCOME, {
            reply_markup: KeyboardLayouts.startKeyboard,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        logger.error(
            { error: errorMessage, chatId: msg.chat.id },
            "Error in start handler"
        );
        await bot.sendMessage(
            msg.chat.id,
            "❌ Произошла ошибка при регистрации"
        );
    }
}

/**
 * Handles monitoring start requests
 */
async function startPollingHandler({ msg, bot, db }: HandlerArgs) {
    try {
        if (db.state.isPollingOn) {
            await bot.sendMessage(
                msg.chat.id,
                MESSAGES.MONITORING_ALREADY_STARTED,
                {
                    reply_markup: KeyboardLayouts.stopKeyboard,
                }
            );
            return;
        }

        if (isAllCampsBooked(db)) {
            await bot.sendMessage(msg.chat.id, MESSAGES.ALL_CAMPS_BOOKED, {
                reply_markup: KeyboardLayouts.startKeyboard,
            });
            return;
        }

        await startMonitoring(bot, db);
    } catch (error) {
        logger.error(
            { error: getErrorMessage(error) },
            "Error starting monitoring"
        );
        await bot.sendMessage(msg.chat.id, "❌ Ошибка при запуске мониторинга");
    }
}

/**
 * Handles monitoring stop requests
 */
async function stopPollingHandler({ msg, bot, db }: HandlerArgs) {
    try {
        if (!db.state.isPollingOn) {
            await bot.sendMessage(
                msg.chat.id,
                MESSAGES.MONITORING_ALREADY_STOPPED,
                {
                    reply_markup: KeyboardLayouts.startKeyboard,
                }
            );
            return;
        }

        await stopMonitoring(bot, db);
    } catch (error) {
        logger.error(
            { error: getErrorMessage(error) },
            "Error stopping monitoring"
        );
        await bot.sendMessage(
            msg.chat.id,
            "❌ Ошибка при остановке мониторинга"
        );
    }
}

/**
 * Sends log file to the requesting chat
 */
async function getLogsHandler({ msg, bot }: HandlerArgs) {
    try {
        await bot.sendDocument(msg.chat.id, createReadStream(CONFIG.logPath));
        logger.info({ chatId: msg.chat.id }, "📝 Logs sent to chat");
    } catch (error) {
        logger.error(
            { error: getErrorMessage(error), chatId: msg.chat.id },
            "Error sending logs"
        );
        await bot.sendMessage(msg.chat.id, "❌ Ошибка при отправке логов");
    }
}

/**
 * Sends current monitoring status
 */
async function getStatusHandler({ msg, bot, db }: HandlerArgs) {
    try {
        const statusMessage = buildStatusMessage(db);
        await bot.sendMessage(msg.chat.id, statusMessage);
        logger.info({ chatId: msg.chat.id }, "📊 Status sent to chat");
    } catch (error) {
        logger.error(
            { error: getErrorMessage(error), chatId: msg.chat.id },
            "Error sending status"
        );
        await bot.sendMessage(msg.chat.id, "❌ Ошибка при получении статуса");
    }
}

/**
 * Resets camp booking state
 */
async function resetCampStateHandler({ msg, bot, db }: HandlerArgs) {
    try {
        await db.resetCampState();
        await bot.sendMessage(msg.chat.id, MESSAGES.STATE_RESET);

        if (db.state.isPollingOn) {
            await stopPollingHandler({ msg, bot, db });
        }

        logger.info("🔄 Camp state reset");
    } catch (error) {
        logger.error(
            { error: getErrorMessage(error) },
            "Error resetting camp state"
        );
        await bot.sendMessage(msg.chat.id, "❌ Ошибка при сбросе состояния");
    }
}

/**
 * Main message router
 */
export function messageHandler(args: HandlerArgs): void {
    const handlerMap: Record<string, MessageHandler> = {
        [BOT_COMMANDS.START]: startPollingHandler,
        [BOT_COMMANDS.STOP]: stopPollingHandler,
        [BOT_COMMANDS.LOGS]: getLogsHandler,
        [BOT_COMMANDS.STATUS]: getStatusHandler,
        [BOT_COMMANDS.RESET]: resetCampStateHandler,
    };

    const text = args.msg.text;
    const handler = handlerMap[text ?? ""];

    if (handler) {
        // Handle async functions properly
        const result = handler(args);
        if (result instanceof Promise) {
            result.catch((error) =>
                logger.error(
                    { error: error.message, text },
                    "Unhandled error in message handler"
                )
            );
        }
    }
}

// Helper functions

/**
 * Checks if all camping spots are already booked
 */
function isAllCampsBooked(db: Db): boolean {
    return Object.values(db.state.campState).every((state) => !state);
}

/**
 * Starts the monitoring process
 */
async function startMonitoring(bot: TelegramBot, db: Db) {
    const notificationService = new NotificationService(bot);
    const { chatIds } = db.state;
    const startMessage = MESSAGES.MONITORING_STARTED(
        CONFIG.checkInterval / 1000
    );

    logger.info("🟢 Monitoring started");
    await db.startPolling();

    // Notify all chats about monitoring start
    await notificationService.notifyAllChats(chatIds, startMessage, {
        reply_markup: KeyboardLayouts.stopKeyboard,
    });

    // Start polling all monitored URLs
    await Promise.allSettled(
        monitoredUrls.map((monitoredUrl) =>
            pollCampingUrl({ monitoredUrl, bot, db })
        )
    );

    // Notify success and stop monitoring
    await notificationService.notifyAllChats(
        chatIds,
        MESSAGES.ALL_CAMPS_SUCCESS,
        { reply_markup: KeyboardLayouts.startKeyboard }
    );

    await db.stopPolling();

    logger.info("🎉 All URLs have returned success responses!");
}

/**
 * Stops the monitoring process
 */
async function stopMonitoring(bot: TelegramBot, db: Db) {
    const notificationService = new NotificationService(bot);
    const { chatIds } = db.state;

    await db.stopPolling();
    logger.info("🔴 Monitoring stopped");

    await notificationService.notifyAllChats(
        chatIds,
        MESSAGES.MONITORING_STOPPED,
        {
            reply_markup: KeyboardLayouts.startKeyboard,
        }
    );
}

/**
 * Builds status message with current monitoring state
 */
function buildStatusMessage(db: Db): string {
    const { isPollingOn, campState } = db.state;

    const campInfo = Object.entries(campState)
        .map(([value, state]) => {
            const campName = valueToNameMap[value as CampValue];
            const status = state ? "⌛️ В процессе" : "✅ Забронирована";
            return `· ${campName}: ${status}`;
        })
        .join("\n");

    const monitoringStatus = isPollingOn ? "🟢 Включен" : "🔴 Остановлен";

    return `📊 Статус мониторинга:\n\nМониторинг: ${monitoringStatus}\n\nСостояние стоянок:\n\n${campInfo}`;
}
