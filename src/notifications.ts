import TelegramBot from "node-telegram-bot-api";
import { logger } from "./logger";

export async function sendSuccessNotification(
    bot: TelegramBot,
    chatId: string,
    name: string
) {
    const message = `
🎉 УСПЕХ!

Время: ${new Date().toLocaleString("ru-RU")}
Результат: стоянка <b><i>${name}</i></b> успешно забронирована! ⛺️
    `;
    try {
        await bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
        });
    } catch (error) {
        logger.fatal("Ошибка отправки сообщения:", error);
    }
}
