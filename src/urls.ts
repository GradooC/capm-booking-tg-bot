import { CONFIG } from "./config";
import { CampValue, MonitoredUrl } from "./types";

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
                value: CampValue.Perovoloka,
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
                value: CampValue.Khutorok,
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
                value: CampValue.KupalskayaNoc,
                capacity: 8,
            },
            numberOfAdult: "8",
            ...commonPayload,
        },
    },
] satisfies MonitoredUrl[];
