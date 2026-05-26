export interface SourceMapConsumer {
    originalPositionFor(generatedPosition: { line: number; column: number }): {
        source: string | null;
        line: number | null;
        column: number | null;
        name: string | null;
    };
    destroy(): void;
}

interface SourceMapNamespace {
    SourceMapConsumer: {
        new (rawSourceMap: unknown): Promise<SourceMapConsumer>;
        initialize(config: { "lib/mappings.wasm": string }): void;
    };
}

declare global {
    interface Window {
        sourceMap: SourceMapNamespace;
    }
}

export function addScript() {
    const scriptElementId = "npm-source-map";
    return new Promise<void>((resolve, reject) => {
        try {
            if (!document.getElementById(scriptElementId)) {
                const script = document.createElement("script");
                script.setAttribute("id", scriptElementId);
                script.src = "https://unpkg.com/source-map@0.7.3/dist/source-map.js";
                script.onload = () => {
                    window.sourceMap.SourceMapConsumer.initialize({
                        "lib/mappings.wasm": "https://cdn.jsdelivr.net/npm/source-map@0.7.3/lib/mappings.wasm"
                    });
                    resolve();
                };
                document.head.append(script);
            }
        } catch {
            reject();
        }
    });
}
