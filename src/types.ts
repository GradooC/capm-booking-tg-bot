export enum CampValue {
    Perovoloka = "43",
    Khutorok = "44",
    KupalskayaNoc = "128",
}

export const valueToNameMap = {
    [CampValue.Perovoloka]: "Переволока",
    [CampValue.Khutorok]: "Хуторок",
    [CampValue.KupalskayaNoc]: "Купальская Ночь",
};

/**
 * API response type
 */
export type ApiResponse = {
    isSuccessful: boolean;
    message: string | null;
    errorMessage: string | null;
    data: unknown | null;
    targetUrl: string | null;
};

/**
 * Camping selection type
 */
export type SelectedCamping = {
    text: string;
    value: CampValue;
    capacity: number;
};

/**
 * Monitored URL type
 */
export type MonitoredUrl = {
    name: string;
    url: string;
    payload: {
        selectedCamping: SelectedCamping;
        isAgree: boolean;
        fullName: string;
        phoneNumber: string;
        email: string;
        startDate: string;
        endDate: string;
        numberOfAdult: string;
        numberOfChildren: string;
        tenantId: string | null;
        notes: string;
        source: string | null;
    };
};
