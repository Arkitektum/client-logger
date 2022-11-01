// Functions
import { createUUID } from "./generators";
import { addScript } from "./dom";
import { getErrorDataFromSourceMap, getErrorDataFromError } from "./functions";

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

class LogData {
    logMessages: Array<LogMessage>;

    constructor(appName: string, sessionId: string, logMessages: Array<LogMessage>) {
        this.logMessages = this.populateLogMessagesWithCommonProperties(logMessages, appName, sessionId);
    }

    private populateLogMessagesWithCommonProperties(logMessages: Array<LogMessage>, appName, sessionId) {
        return logMessages.map((logMessage) => {
            return {
                ...logMessage,
                appName,
                sessionId,
                clientInfo: this.getClientInfo()
            };
        });
    }

    private getClientInfo() {
        const { userAgent, vendor, platform, cookieEnabled } = window.navigator;
        return { userAgent, vendor, platform, cookieEnabled };
    }
}

export class ClientLogger {
    logApiUrl: string;
    sourceMapUrl: string;
    sourceMapJson: string;
    appName: string;
    sessionId: string;

    constructor(logApiUrl: string, sourceMapJson: string, appName: string) {
        this.logApiUrl = logApiUrl;
        this.sourceMapJson = sourceMapJson;
        this.appName = appName;
        this.sessionId = this.getSessionId();
    }

    private getSessionId() {
        if (sessionStorage?.["sessionId"]?.length) {
            return sessionStorage["sessionId"];
        } else {
            const sessionId = createUUID();
            sessionStorage["sessionId"] = sessionId;
            return sessionId;
        }
    }

    public static async create(logApiUrl: string, sourceMapUrl: string, appName: string) {
        try {
            await addScript();
        } catch {
            throw new Error("Could not add Source Map script to DOM.");
        }

        const sourceMapResponse = sourceMapUrl?.length ? await fetch(sourceMapUrl) : null;
        const sourceMapJson = await sourceMapResponse?.json();
        const consumer = sourceMapJson !== null ? await new window.sourceMap.SourceMapConsumer(sourceMapJson) : null;

        const clientLogger = new ClientLogger(logApiUrl, sourceMapJson, appName);

        window.onerror = async (
            event: Event | string,
            source?: string,
            line?: number,
            column?: number,
            error?: Error
        ) => {
            const errorData = getErrorDataFromSourceMap(event, source, line, column, consumer);
            const logMessages = [errorData];
            clientLogger.postLogData(logMessages);
        };
        consumer?.destroy();
        return clientLogger;
    }

    public async getLogMessageFromError(error: Error, logMessageProps: LogMessage) {
        const consumer =
            this.sourceMapJson !== null ? await new window.sourceMap.SourceMapConsumer(this.sourceMapJson) : null;
        const errorData = getErrorDataFromError(error, consumer);
        return {
            ...logMessageProps,
            ...errorData
        };
    }

    public postLogData(logMessages: Array<LogMessage>) {
        const logData = new LogData(this.appName, this.sessionId, logMessages)?.logMessages;
        const fetchOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(logData)
        };
        fetch(this.logApiUrl, fetchOptions);
    }
}
