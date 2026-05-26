import { getErrorDataFromError, getErrorDataFromSourceMap } from "./functions";
import type { SourceMapConsumer } from "./dom";

function makeConsumer(
    originalPosition: { source: string | null; line: number | null; column: number | null; name: string | null } = {
        source: "src/app.ts",
        line: 5,
        column: 2,
        name: "handler"
    }
): SourceMapConsumer {
    return {
        originalPositionFor: jest.fn().mockReturnValue(originalPosition),
        destroy: jest.fn()
    };
}

function errorWithStack(stack: string | undefined, message = "boom"): Error {
    const error = new Error(message);
    Object.defineProperty(error, "stack", { value: stack, configurable: true });
    return error;
}

describe("getErrorDataFromError", () => {
    it("uses the consumer to map a position when stack provides line/column", () => {
        const consumer = makeConsumer({ source: "src/app.ts", line: 10, column: 5, name: "handler" });
        const error = errorWithStack("Error: boom\n    at fn (https://example.com/app.min.js:100:25)");

        const result = getErrorDataFromError(error, consumer);

        expect(consumer.originalPositionFor).toHaveBeenCalledWith({ line: 100, column: 25 });
        expect(result.message).toBe("boom");
        expect(result.originalPosition).toEqual({ source: "src/app.ts", line: 10, column: 5, name: "handler" });
    });

    it("falls back to stack-parsed values when consumer is null", () => {
        const error = errorWithStack("Error: boom\n    at fn (https://example.com/path/app.min.js:42:7)");

        const result = getErrorDataFromError(error, null);

        expect(result.originalPosition).toEqual({
            source: "app.min.js",
            line: 42,
            column: 7,
            name: null
        });
    });

    it("returns null position fields when error has no stack", () => {
        const consumer = makeConsumer();
        const error = errorWithStack(undefined);

        const result = getErrorDataFromError(error, consumer);

        expect(consumer.originalPositionFor).not.toHaveBeenCalled();
        expect(result.originalPosition).toEqual({ source: null, line: null, column: null, name: null });
    });

    it("returns null position fields when stack contains no http URL", () => {
        const consumer = makeConsumer();
        const error = errorWithStack("Error: boom\n    at <anonymous>");

        const result = getErrorDataFromError(error, consumer);

        expect(consumer.originalPositionFor).not.toHaveBeenCalled();
        expect(result.originalPosition).toEqual({ source: null, line: null, column: null, name: null });
    });

    it("propagates the error message", () => {
        const error = errorWithStack("Error: ka-boom\n    at fn (https://example.com/app.js:1:1)", "ka-boom");
        expect(getErrorDataFromError(error, null).message).toBe("ka-boom");
    });

    it("matches https URLs, not just http", () => {
        const error = errorWithStack("at fn (https://cdn.example.com/bundle.js:200:50)");
        const result = getErrorDataFromError(error, null);
        expect(result.originalPosition.source).toBe("bundle.js");
        expect(result.originalPosition.line).toBe(200);
        expect(result.originalPosition.column).toBe(50);
    });
});

describe("getErrorDataFromSourceMap", () => {
    it("calls originalPositionFor when consumer and positions are provided", () => {
        const consumer = makeConsumer({ source: "src/app.ts", line: 1, column: 1, name: null });
        const result = getErrorDataFromSourceMap("uh oh", "app.min.js", 50, 10, undefined, consumer);

        expect(consumer.originalPositionFor).toHaveBeenCalledWith({ line: 50, column: 10 });
        expect(result.originalPosition).toEqual({ source: "src/app.ts", line: 1, column: 1, name: null });
        expect(result.message).toBe("uh oh");
        expect(result.level).toBe("Error");
    });

    it("falls back to provided source/line/column when consumer is null", () => {
        const result = getErrorDataFromSourceMap("uh oh", "app.min.js", 50, 10, undefined, null);
        expect(result.originalPosition).toEqual({ source: "app.min.js", line: 50, column: 10, name: null });
    });

    it("returns null fields when line or column are undefined", () => {
        const consumer = makeConsumer();
        const result = getErrorDataFromSourceMap("uh oh", undefined, undefined, undefined, undefined, consumer);
        expect(consumer.originalPositionFor).not.toHaveBeenCalled();
        expect(result.originalPosition).toEqual({ source: null, line: null, column: null, name: null });
    });

    it("uses error.stack when an Error is supplied", () => {
        const error = new Error("nope");
        const result = getErrorDataFromSourceMap("uh oh", "app.js", 1, 1, error, null);
        expect(result.stackTrace).toBe(error.stack);
    });

    it("stringifies event when it is an Event object", () => {
        const event = new Event("error");
        const result = getErrorDataFromSourceMap(event, undefined, undefined, undefined, undefined, null);
        expect(typeof result.message).toBe("string");
    });
});
