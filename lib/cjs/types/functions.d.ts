export declare function getErrorDataFromError(error: Error, consumer: any): {
    message: string;
    originalPosition: any;
};
export declare function getErrorDataFromSourceMap(event: Event | string, source?: string, line?: number, column?: number, consumer?: any): {
    message: string;
    originalPosition: any;
};
