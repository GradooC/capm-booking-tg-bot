import fs from "node:fs";
import path from "node:path";
import { CampValue } from "./types";

type State = typeof defaultState;

const defaultState = {
    chatIds: [] as number[],
    isPollingOn: false,
    campState: {
        [CampValue.Khutorok]: true,
        [CampValue.KupalskayaNoc]: true,
        [CampValue.Perovoloka]: true,
    },
};

export class Db {
    private _state: State;
    private file: string;

    constructor() {
        const dataDir = path.resolve(__dirname, "../data");
        fs.mkdirSync(dataDir, { recursive: true });
        this.file = path.resolve(dataDir, "state.json");

        if (fs.existsSync(this.file)) {
            const state = fs.readFileSync(this.file, "utf-8");
            this._state = JSON.parse(state);
        } else {
            fs.writeFileSync(
                this.file,
                JSON.stringify(defaultState, null, 2),
                "utf-8"
            );
            this._state = defaultState;
        }
    }

    public get state() {
        return this._state;
    }

    private async saveState() {
        await fs.promises.writeFile(
            this.file,
            JSON.stringify(this._state, null, 2),
            "utf-8"
        );
    }

    public async addChatId(chatId: number) {
        const chatIdsSet = new Set(this._state.chatIds);
        chatIdsSet.add(chatId);
        this._state.chatIds = Array.from(chatIdsSet);
        await this.saveState();
    }

    public async startPolling() {
        this._state.isPollingOn = true;
        await this.saveState();
    }

    public async stopPolling() {
        this._state.isPollingOn = false;
        await this.saveState();
    }

    public async startPollingByCampValue(value: CampValue) {
        this._state.campState[value] = true;
        await this.saveState();
    }

    public async stopPollingByCampValue(value: CampValue) {
        this._state.campState[value] = false;
        await this.saveState();
    }

    public isPollingActive(value: CampValue) {
        return this._state.isPollingOn && this._state.campState[value];
    }
}
