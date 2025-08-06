import dotenv from "dotenv";

dotenv.config({ debug: true });

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables");
}
if (!process.env.CHECK_INTERVAL) {
    throw new Error("CHECK_INTERVAL is not set in environment variables");
}

export const CONFIG = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    checkInterval: parseInt(process.env.CHECK_INTERVAL, 10),
    isDevelopment: process.env.NODE_ENV === "development",
    url: "https://admin3.zapytai.by/widget/createBooking",
};
