import dotenv from "dotenv";
import path from "path";
import fs from "node:fs";

dotenv.config({ debug: true });

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set in environment variables`);
    }
    return value;
}

function getLogPath(): string {
    const dataDir = path.resolve(__dirname, "../data");
    fs.mkdirSync(dataDir, { recursive: true });

    return path.resolve(dataDir, "app.log");
}

export const CONFIG = {
    token: getEnvVar("TELEGRAM_BOT_TOKEN"),
    email: getEnvVar("EMAIL"),
    fullName: getEnvVar("FULL_NAME"),
    phoneNumber: getEnvVar("PHONE_NUMBER"),
    checkInterval: 1000,
    url: "https://admin3.zapytai.by/widget/createBooking",
    logPath: getLogPath(),
    isDevelopment: process.env.NODE_ENV === "development",
};
