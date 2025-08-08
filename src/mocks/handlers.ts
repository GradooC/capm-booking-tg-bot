import { http, HttpResponse } from "msw";
import { MonitoredUrl, SelectedCamping } from "../types";
import { CONFIG } from "../config";

const requestCounters = {
    "43": 15,
    "44": 10,
    "128": 8,
} satisfies Record<SelectedCamping["value"], number>;

export const handlers = [
    http.post<Record<string, never>, MonitoredUrl["payload"]>(
        CONFIG.url,
        async ({ request }) => {
            const {
                selectedCamping: { value },
            } = await request.json();

            requestCounters[value] -= 1;

            switch (true) {
                case requestCounters[value] < 1:
                    return HttpResponse.json(
                        { isSuccess: true },
                        { status: 200 }
                    );
                default:
                    return HttpResponse.json(
                        {
                            isSuccess: false,
                            message:
                                "Выбранные даты уже заняты. Смотрите шахматку для поиска свободных дат",
                        },
                        { status: 200 }
                    );
            }
        }
    ),
];
