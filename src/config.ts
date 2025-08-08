import dotenv from "dotenv";
import path from "path";

dotenv.config({ debug: true });

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set in environment variables`);
    }
    return value;
}

export const CONFIG = {
    token: getEnvVar("TELEGRAM_BOT_TOKEN"),
    email: getEnvVar("EMAIL"),
    fullName: getEnvVar("FULL_NAME"),
    phoneNumber: getEnvVar("PHONE_NUMBER"),
    checkInterval: 1000,
    url: "https://admin3.zapytai.by/widget/createBooking",
    logPath: path.resolve(__dirname, "../app.log"),
    isDevelopment: process.env.NODE_ENV === "development",
};
