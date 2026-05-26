import { SourceMapConsumer } from "./dom";

function getErrorDataFromStack(error: Error) {
    const stackRegex = /(?<source>https?:\/\/\S+?):(?<line>\d+):(?<column>\d+)/g;

    if (error?.stack?.length) {
        const stack = error.stack.toString();
        const matches = [...stack.matchAll(stackRegex)];
        if (matches.length) {
            const matchGroup = matches?.[0]?.groups;
            const source = matchGroup?.source;

            return {
                source: source?.substring(source.lastIndexOf("/") + 1),
                line: matchGroup?.line?.length ? parseInt(matchGroup?.line) : null,
                column: matchGroup?.column?.length ? parseInt(matchGroup.column) : null
            };
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export function getErrorDataFromError(error: Error, consumer: SourceMapConsumer | null) {
    const errorData = getErrorDataFromStack(error);
    if (consumer !== null && errorData !== null && errorData.line !== null && errorData.column !== null) {
        const originalPosition = consumer.originalPositionFor({ line: errorData.line, column: errorData.column });
        return {
            message: error?.message,
            stackTrace: error?.message ? new Error(error?.message)?.stack : null,
            originalPosition
        };
    }
    return {
        message: error?.message,
        stackTrace: error?.message ? new Error(error?.message)?.stack : null,
        originalPosition: {
            source: errorData?.source ?? null,
            line: errorData?.line ?? null,
            column: errorData?.column ?? null,
            name: null
        }
    };
}

export function getErrorDataFromSourceMap(event: Event | string, source?: string, line?: number, column?: number, error?: Error, consumer?: SourceMapConsumer | null) {
    if (consumer !== null && line !== undefined && column !== undefined) {
        const originalPosition = consumer?.originalPositionFor({ line, column });
        return {
            message: event.toString(),
            stackTrace: error?.stack,
            level: "Error",
            originalPosition
        };
    }
    return {
        message: event.toString(),
        stackTrace: error?.stack,
        level: "Error",
        originalPosition: {
            column: column ?? null,
            line: line ?? null,
            source: source ?? null,
            name: null
        }
    };
}
