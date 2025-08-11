import TelegramBot from 'node-telegram-bot-api';

/**
 * Bot command identifiers
 */
export const BOT_COMMANDS = {
    START: '🟢 Start',
    STOP: '🔴 Stop',
    LOGS: '📝 Get Logs',
    STATUS: '📊 Get Status',
    RESET: '🔄 Reset Camp State',
} as const;

/**
 * Keyboard layouts for different bot states
 */
export class KeyboardLayouts {
    private static createKeyboard(buttons: string[][]): TelegramBot.ReplyKeyboardMarkup {
        return {
            keyboard: buttons.map((row) => row.map((text) => ({ text }))),
            resize_keyboard: true,
        };
    }

    static get commonButtons(): string[] {
        return [BOT_COMMANDS.LOGS, BOT_COMMANDS.STATUS, BOT_COMMANDS.RESET];
    }

    static get startKeyboard(): TelegramBot.ReplyKeyboardMarkup {
        return this.createKeyboard([[BOT_COMMANDS.START], this.commonButtons]);
    }

    static get stopKeyboard(): TelegramBot.ReplyKeyboardMarkup {
        return this.createKeyboard([[BOT_COMMANDS.STOP], this.commonButtons]);
    }
}
