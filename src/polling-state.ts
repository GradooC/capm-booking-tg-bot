
/**
 * Manages polling state for monitoring
 */
class PollingManager {
    private pollingState = false;

    /**
     * Returns whether polling is active
     */
    isActive(): boolean {
        return this.pollingState;
    }

    /**
     * Sets polling state
     */
    setActive(active: boolean): void {
        this.pollingState = active;
    }
}

export const pollingManager = new PollingManager();
