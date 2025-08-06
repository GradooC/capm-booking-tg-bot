class PollingManager {
    private pollingState = false;

    isActive(): boolean {
        return this.pollingState;
    }

    setActive(active: boolean): void {
        this.pollingState = active;
    }
}

export const pollingManager = new PollingManager();
