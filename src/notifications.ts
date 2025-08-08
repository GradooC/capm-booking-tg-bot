import TelegramBot from "node-telegram-bot-api";
import { logger } from "./logger";

/**
 * Sends a success notification to the user
 */
export async function sendSuccessNotification(
    bot: TelegramBot,
    chatId: number,
    name: string
) {
    const message = `\n🎉 УСПЕХ!\n\nВремя: ${new Date().toLocaleString(
        "ru-RU"
    )}\nРезультат: стоянка <b><i>${name}</i></b> успешно забронирована! ⛺️`;
    try {
        await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    } catch (error) {
        logger.fatal("Ошибка отправки сообщения:", error);
    }
}
