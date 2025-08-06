export type ApiResponse = {
    isSuccessful: boolean;
    message: string | null;
    errorMessage: string | null;
    data: any | null;
    targetUrl: string | null;
};

export type SelectedCamping = {
    text: string;
    value: "43" | "44";
    capacity: number;
};

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
