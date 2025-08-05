import { MonitoredUrl } from './types';

export const monitoredUrls = [
    {
        name: 'Переволока',
        url: 'https://admin3.zapytai.by/widget/createBooking',
        payload: {
            selectedCamping: {
                text: 'Переволока - (6) мест',
                value: '43',
                capacity: 6,
            },
            isAgree: true,
            fullName: 'Пупкин',
            phoneNumber: '+375 29 111 11 11',
            email: 'gakiziddeppou-3417@yopmail.com',
            startDate: '2025-08-03T21:00:00.000Z',
            endDate: '2025-08-05T21:00:00.000Z',
            numberOfAdult: '6',
            numberOfChildren: '0',
            tenantId: null,
            notes: '',
            source: null,
        },
    },
    {
        name: 'Хуторок',
        url: 'https://admin3.zapytai.by/widget/createBooking',
        payload: {
            selectedCamping: {
                text: 'Хуторок - (8) мест',
                value: '44',
                capacity: 8,
            },
            isAgree: true,
            fullName: 'пупкин',
            phoneNumber: '+375 29 111 11 11',
            email: 'pupkin@mail.ru',
            startDate: '2025-08-04T21:00:00.000Z',
            endDate: '2025-08-06T21:00:00.000Z',
            numberOfAdult: '8',
            numberOfChildren: '0',
            tenantId: null,
            notes: '',
            source: null,
        },
    },
] satisfies MonitoredUrl[];
