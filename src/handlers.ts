import TelegramBot, { type Message } from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { pollUrls } from "./check-url";
import { pollingManager } from "./polling-state";
import { monitoredUrls } from "./urls";

export async function startHandler(msg: Message, bot: TelegramBot) {
    const chatId = msg.chat.id.toString();
    pollingManager.setActive(true);
    const message = `🟢 Мониторинг запущен!\nИнтервал проверки: ${
        CONFIG.checkInterval / 1000
    } сек`;
    await bot.sendMessage(chatId, message);
    pollUrls(monitoredUrls, { bot, chatId });
}

export async function stopHandler(msg: Message, bot: TelegramBot) {
    const chatId = msg.chat.id.toString();
    pollingManager.setActive(false);
    await bot.sendMessage(
        chatId,
        "⛔️ Мониторинг остановлен! Вы можете снова запустить его командой /start."
    );
}
