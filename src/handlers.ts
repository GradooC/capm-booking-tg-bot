import TelegramBot, { type Message } from 'node-telegram-bot-api';
import { CONFIG } from './config';
import { pollUrls } from './check-url';
import { monitoredUrls } from './urls';

export async function startHandler(msg: Message, bot: TelegramBot) {
    const chatId = msg.chat.id.toString();
    const message = `🟢 Мониторинг запущен!
Интервал проверки: ${CONFIG.checkInterval / 1000} сек`;

    await bot.sendMessage(chatId, message);

    pollUrls(monitoredUrls);
}
