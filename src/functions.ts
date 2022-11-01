function getErrorDataFromStack(error: Error) {
    const stackRegex = /(?<source>http.*?):(?<line>\d+):(?<column>\d+)/g;

    if (!!error?.stack?.length) {
        const stack = error.stack.toString();
        const matches = [...stack.matchAll(stackRegex)];
        if (!!matches.length) {
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

export function getErrorDataFromError(error: Error, consumer: any) {
    const errorData = getErrorDataFromStack(error);
    if (consumer !== null && errorData !== null) {
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
            source: errorData?.source,
            line: errorData?.line,
            column: errorData?.column
        }
    };
}

export function getErrorDataFromSourceMap(
    event: Event | string,
    source?: string,
    line?: number,
    column?: number,
    error?: Error,
    consumer?: any
) {
    if (consumer !== null && line !== undefined && column !== undefined) {
        const originalPosition = consumer.originalPositionFor({ line, column });
        return {
            message: event.toString(),
            stackTrace: error?.stack,
            originalPosition
        };
    }
    return {
        message: event.toString(),
        stackTrace: error?.stack,
        originalPosition: {
            column,
            line,
            source
        }
    };
}
