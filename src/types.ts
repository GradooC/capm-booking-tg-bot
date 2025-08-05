export type ApiResponse = {
    isSuccessful: boolean;
    message: string | null;
    errorMessage: string | null;
    data: any | null;
    targetUrl: string | null;
};

export type MonitoredUrl = {
    name: string;
    url: string;
    payload: {
        selectedCamping: {
            text: string;
            value: string;
            capacity: number;
        };
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
