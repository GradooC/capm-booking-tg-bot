import { CONFIG } from "./config";
import { MonitoredUrl } from "./types";

const { url } = CONFIG;
const commonPayload = {
    isAgree: true,
    fullName: "пупкин",
    phoneNumber: "+375 29 111 11 11",
    email: "pupkin@mail.ru",
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
] satisfies MonitoredUrl[];
