import { isAxiosError } from 'axios';
import { logger } from './logger';

export function handlePollingError(error: unknown, name: string) {
    if (isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logger.warn(`⏰ Request timeout for ${name} (10s) - continuing to poll...`);
        } else if (error.response) {
            logger.warn(
                `❌ Server error for ${name} (${error.response?.status}) - continuing to poll...`,
            );
        } else if (error.request) {
            logger.warn(`🌐 Network error for ${name} - continuing to poll...`);
        } else {
            logger.warn(`❌ Error polling ${name}: ${error.message} - continuing to poll...`);
        }
    } else {
        logger.error(`❌ Unexpected error polling ${name}:`, error);
    }
}
