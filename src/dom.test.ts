/**
 * @jest-environment jsdom
 */
import { addScript } from "./dom";

describe("addScript", () => {
    let initializeMock: jest.Mock;

    beforeEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "";

        initializeMock = jest.fn();
        (window as any).sourceMap = {
            SourceMapConsumer: { initialize: initializeMock }
        };
    });

    it("appends a <script> with the expected id and src", () => {
        addScript();

        const script = document.getElementById("npm-source-map") as HTMLScriptElement | null;
        expect(script).not.toBeNull();
        expect(script?.tagName).toBe("SCRIPT");
        expect(script?.src).toBe("https://unpkg.com/source-map@0.7.3/dist/source-map.js");
    });

    it("resolves the promise once script.onload fires", async () => {
        const promise = addScript();
        const script = document.getElementById("npm-source-map") as HTMLScriptElement;

        script.onload?.(new Event("load"));

        await expect(promise).resolves.toBeUndefined();
    });

    it("initializes SourceMapConsumer with the wasm URL on load", async () => {
        const promise = addScript();
        const script = document.getElementById("npm-source-map") as HTMLScriptElement;

        script.onload?.(new Event("load"));
        await promise;

        expect(initializeMock).toHaveBeenCalledWith({
            "lib/mappings.wasm": "https://cdn.jsdelivr.net/npm/source-map@0.7.3/lib/mappings.wasm"
        });
    });

    it("does not append a second script when one with the id already exists", () => {
        const existing = document.createElement("script");
        existing.id = "npm-source-map";
        document.head.appendChild(existing);

        addScript();

        expect(document.querySelectorAll("#npm-source-map").length).toBe(1);
    });
});
