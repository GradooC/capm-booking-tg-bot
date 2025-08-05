import { http, HttpResponse } from 'msw';
import { MonitoredUrl } from '../types';

// Counter to track requests for each URL
const requestCounters = new Map<string, number>();

export const handlers = [
    // Mock for createBooking endpoint
    http.post<Record<string, never>, MonitoredUrl['payload']>(
        'https://admin3.zapytai.by/widget/createBooking',
        async ({ request }) => {
            const { selectedCamping } = await request.json();

            // Get current count for this URL
            const currentCount =
                requestCounters.get(selectedCamping.value) || 0;

            // Increment counter
            requestCounters.set(selectedCamping.value, currentCount + 1);

            switch (true) {
                case currentCount > 5:
                    return HttpResponse.json(
                        { isSuccess: true },
                        { status: 200 }
                    );
                default:
                    return HttpResponse.json(
                        {
                            isSuccess: false,
                            message:
                                'Выбранные даты уже заняты. Смотрите шахматку для поиска свободных дат',
                        },
                        { status: 200 }
                    );
            }
        }
    ),
];
