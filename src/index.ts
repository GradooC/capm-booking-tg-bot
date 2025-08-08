import TelegramBot from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { messageHandler, startHandler, stopHandler } from "./handlers";
import { logger } from "./logger";
import { commonPayload } from "./urls";

function setupMocksIfNeeded() {
    if (CONFIG.isDevelopment) {
        logger.info("🔧 Starting in development mode with mocks...");
        const { server } = require("./mocks/server");
        server.listen({ onUnhandledRequest: "bypass" });
    }
}

function setupProcessSignals() {
    process.on("SIGINT", () => {
        logger.info("Получен сигнал SIGINT, останавливаем мониторинг...");
        process.exit(0);
    });
    process.on("SIGTERM", () => {
        logger.info("Получен сигнал SIGTERM, останавливаем мониторинг...");
        process.exit(0);
    });
}

function main() {
    setupMocksIfNeeded();

    const bot = new TelegramBot(CONFIG.token, { polling: true });

    logger.info({ commonPayload }, "🤖 Telegram Monitor Bot запущен!");

    bot.onText(/\/start/, (msg) => startHandler(msg, bot));
    bot.onText(/\/stop/, (msg) => stopHandler(msg, bot));
    bot.on("message", (msg) => messageHandler(msg, bot));

    setupProcessSignals();
}

main();
