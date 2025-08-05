import TelegramBot from 'node-telegram-bot-api';
import { CONFIG } from './config';
import { startHandler } from './handlers';
import { server } from './mocks/server';

if (CONFIG.isDevelopment) {
    console.log('🔧 Starting in development mode with mocks...');
    server.listen({ onUnhandledRequest: 'bypass' });
}

const bot = new TelegramBot(CONFIG.token, { polling: true });

console.log('🤖 Telegram Monitor Bot запущен!');

bot.onText(/\/start/, (msg) => startHandler(msg, bot));

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('\nПолучен сигнал SIGINT, останавливаем мониторинг...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nПолучен сигнал SIGTERM, останавливаем мониторинг...');
    process.exit(0);
});
