/**
 * @jest-environment jsdom
 */
import { ClientLogger } from "./index";

const sourceMapUrl = "https://example.com/app.js.map";
const apiUrl = "https://api.example.com/log";

let consumer: { originalPositionFor: jest.Mock; destroy: jest.Mock };
let createElementSpy: jest.SpyInstance;

function installMocks() {
    consumer = {
        originalPositionFor: jest.fn().mockReturnValue({ source: "app.ts", line: 1, column: 1, name: null }),
        destroy: jest.fn()
    };

    const SourceMapConsumerMock: any = function () {
        return Promise.resolve(consumer);
    };
    SourceMapConsumerMock.initialize = jest.fn();
    (window as any).sourceMap = { SourceMapConsumer: SourceMapConsumerMock };

    (global as any).fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ version: 3, mappings: "" })
    });

    const origCreate = document.createElement.bind(document);
    createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = origCreate(tag) as HTMLElement;
        if (tag === "script") {
            queueMicrotask(() => {
                (el as HTMLScriptElement).onload?.(new Event("load"));
            });
        }
        return el;
    });
}

describe("ClientLogger", () => {
    beforeEach(() => {
        sessionStorage.clear();
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        window.onerror = null;
        installMocks();
    });

    afterEach(() => {
        createElementSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it("creates an instance with the supplied logApiUrl and appName", async () => {
        const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");

        expect(logger.appName).toBe("test-app");
        expect(logger.logApiUrl).toBe(apiUrl);
        expect(logger.sessionId).toBeTruthy();
    });

    it("generates a sessionId and persists it in sessionStorage", async () => {
        const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
        expect(sessionStorage.getItem("sessionId")).toBe(logger.sessionId);
    });

    it("reuses an existing sessionId from sessionStorage", async () => {
        sessionStorage.setItem("sessionId", "existing-id");
        const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
        expect(logger.sessionId).toBe("existing-id");
    });

    it("registers a window.onerror handler", async () => {
        await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
        expect(typeof window.onerror).toBe("function");
    });

    it("destroys the SourceMapConsumer after wiring up onerror", async () => {
        await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
        expect(consumer.destroy).toHaveBeenCalled();
    });

    it("fetches the source map when sourceMapUrl is provided", async () => {
        await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
        expect(global.fetch).toHaveBeenCalledWith(sourceMapUrl);
    });

    describe("postLogData", () => {
        it("POSTs enriched log messages to logApiUrl", async () => {
            const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
            (global.fetch as jest.Mock).mockClear();

            logger.postLogData([{ message: "hello" }]);

            expect(global.fetch).toHaveBeenCalledWith(
                apiUrl,
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                })
            );

            const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(body).toHaveLength(1);
            expect(body[0]).toMatchObject({
                message: "hello",
                appName: "test-app",
                sessionId: logger.sessionId,
                clientInfo: expect.objectContaining({ userAgent: expect.any(String) })
            });
        });

        it("preserves custom_fields on the payload", async () => {
            const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");
            (global.fetch as jest.Mock).mockClear();

            logger.postLogData([
                {
                    message: "checkout failed",
                    custom_fields: [
                        { key: "userId", value: "u-1" },
                        { key: "feature", value: "checkout" }
                    ]
                }
            ]);

            const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(body[0].custom_fields).toEqual([
                { key: "userId", value: "u-1" },
                { key: "feature", value: "checkout" }
            ]);
        });

        it("warns and does not call fetch when logApiUrl is empty", async () => {
            const logger = await ClientLogger.create("", sourceMapUrl, "test-app");
            (global.fetch as jest.Mock).mockClear();
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

            logger.postLogData([{ message: "hello" }]);

            expect(global.fetch).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith("Missing value for logApiUrl");
        });
    });

    describe("getLogMessageFromError", () => {
        it("merges errorData with logMessageProps", async () => {
            const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");

            const error = new Error("the underlying error");
            Object.defineProperty(error, "stack", {
                value: "Error: the underlying error\n    at fn (https://example.com/app.js:10:5)",
                configurable: true
            });

            const result = await logger.getLogMessageFromError(error, { level: "Error" });

            expect(result.level).toBe("Error");
            expect(result.message).toContain("the underlying error");
        });

        it("concatenates error.message with logMessageProps.message", async () => {
            const logger = await ClientLogger.create(apiUrl, sourceMapUrl, "test-app");

            const error = new Error("inner");
            Object.defineProperty(error, "stack", {
                value: "Error: inner\n    at fn (https://example.com/app.js:1:1)",
                configurable: true
            });

            const result = await logger.getLogMessageFromError(error, { message: "outer context" });
            expect(result.message).toBe("inner | outer context");
        });
    });
});
