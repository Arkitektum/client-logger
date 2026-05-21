# ClientLogger

## Installation

With Yarn:

```
yarn add @arkitektum/client-logger
```

With npm:

```
npm install @arkitektum/client-logger
```

## Getting started

### Using client-logger in a React app

index.js:

```js
import React from "react";
import ReactDOM from "react-dom/client";
import { ClientLogger } from "@arkitektum/client-logger";
import App from "App";

const apiUrl = "https://url.to.api";
const sourceMapUrl = `${document.currentScript.src}.map`;
const appName = "Application name";

ClientLogger.create(apiUrl, sourceMapUrl, appName).then((clientLogger) => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<App clientLogger={clientLogger} />);
});
```

### Using client-logger with the Fetch API

```js
let logMessage;
fetch(apiUrl, fetchOptions)
    .then((res) => {
        response = res;
        logMessage = {
            statuscode: response?.status,
            path: response?.url
        };
        return res.json();
    })
    .then((fetchedData) => {
        const logMessages = [];

        if (!fetchedData?.arrayWithStuff?.length) {
            logMessages.push({
                ...logMessage,
                level: "Warning",
                message: "No stuff in array"
            });
        }
        if (!fetchedData?.valueThatShouldBeTrue) {
            logMessages.push({
                ...logMessage,
                level: "Warning",
                message: "Value that should be true is not true"
            });
        }

        !!clientLogger.length && clientLogger.postLogData(logMessages);

        return fetchedData;
    })
    .catch((error) => {
        logMessage = {
            level: "Error",
            path: apiUrl
        };
        clientLogger.getLogMessageFromError(error, logMessage).then((logMessage) => {
            clientLogger.postLogData([logMessage]);
        });
    });
```

### Using custom fields

Any `LogMessage` can include a `custom_fields` array to attach arbitrary key/value metadata. These are forwarded as-is to the backend alongside the standard enriched fields.

```js
clientLogger.postLogData([{
    level: "Warning",
    message: "Something unexpected happened",
    custom_fields: [
        { key: "userId", value: "abc123" },
        { key: "feature", value: "checkout" }
    ]
}]);
```

Custom fields can also be combined with error logging:

```js
clientLogger.getLogMessageFromError(error, {
    level: "Error",
    path: apiUrl,
    custom_fields: [
        { key: "userId", value: "abc123" }
    ]
}).then((logMessage) => {
    clientLogger.postLogData([logMessage]);
});
```

## ClientLogger class

```ts
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
    stackTrace?: string;
    statuscode?: string;
    correlationId?: string;
    custom_fields?: Array<{ key: string; value: string }>;
}
declare class ClientLogger {
    logApiUrl: string;
    sourceMapUrl: string;
    sourceMapJson: string;
    appName: string;
    sessionId: string;
    constructor(logApiUrl: string, sourceMapJson: string, appName: string);
    private getSessionId;
    static create(logApiUrl: string, sourceMapUrl: string, appName: string): Promise<ClientLogger>;
    getLogMessageFromError(error: Error, logMessageProps: LogMessage): Promise<LogMessage>;
    postLogData(logMessages: Array<LogMessage>): void;
}
```
