import { CONFIG } from "./config";
import { MonitoredUrl } from "./types";
/**
 * List of monitored URLs and payloads
 */
const { url, fullName, phoneNumber, email } = CONFIG;

export const commonPayload = {
    fullName,
    phoneNumber,
    email,
    isAgree: true,
    startDate: "2025-08-04T21:00:00.000Z",
    endDate: "2025-08-06T21:00:00.000Z",
    numberOfChildren: "0",
    tenantId: null,
    notes: "",
    source: null,
};

export const monitoredUrls = [
    {
        name: "Переволока",
        url,
        payload: {
            selectedCamping: {
                text: "Переволока - (6) мест",
                value: "43",
                capacity: 6,
            },
            numberOfAdult: "6",
            ...commonPayload,
        },
    },
    {
        name: "Хуторок",
        url,
        payload: {
            selectedCamping: {
                text: "Хуторок - (8) мест",
                value: "44",
                capacity: 8,
            },
            numberOfAdult: "8",
            ...commonPayload,
        },
    },
    {
        name: "Купальская ночь",
        url,
        payload: {
            selectedCamping: {
                text: "Купальская ночь - (8) мест",
                value: "128",
                capacity: 8,
            },
            numberOfAdult: "8",
            ...commonPayload,
        },
    },
] satisfies MonitoredUrl[];
