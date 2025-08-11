import TelegramBot from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { messageHandler, startHandler } from "./handlers";
import { logger } from "./logger";
import { commonPayload, monitoredUrls } from "./urls";
import { Db } from "./db";
import { pollCampingUrl } from "./poll-camping-url";

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
    const db = new Db();

    logger.info({ commonPayload }, "🤖 Telegram Monitor Bot запущен!");

    bot.onText(/\/start/, (msg) => startHandler({ msg, bot, db }));
    bot.on("message", (msg) => messageHandler({ msg, bot, db }));

    monitoredUrls.map((monitoredUrl) =>
        pollCampingUrl({ monitoredUrl, bot, db })
    );

    setupProcessSignals();
}

main();
