interface LogMessage {
    appName?: string;
    sessionId?: string;
    clientInfo?: object;
    level?: string;
    message?: string;
    originalPosition?: {
        column: number;
        line: number;
        name: string;
        source: string;
    };
    path?: string;
    stacktrace?: string;
    statuscode?: string;
    correlationId?: string;
}
export declare class ClientLogger {
    logApiUrl: string;
    sourceMapUrl: string;
    sourceMapJson: string;
    appName: string;
    sessionId: string;
    constructor(logApiUrl: string, sourceMapJson: string, appName: string);
    private getSessionId;
    static create(logApiUrl: string, sourceMapUrl: string, appName: string): Promise<ClientLogger>;
    getLoggMessageFromError(error: Error, logMessageProps: LogMessage): Promise<{
        message: string;
        originalPosition: any;
        appName?: string;
        sessionId?: string;
        clientInfo?: object;
        level?: string;
        path?: string;
        stacktrace?: string;
        statuscode?: string;
        correlationId?: string;
    }>;
    postLogData(logMessages: Array<LogMessage>): void;
}
export {};
