
declare global {
    interface Window {
        sourceMap: any;
    }
}

export function addScript() {
    const scriptElementId = "npm-source-map";
    return new Promise((resolve: Function, reject) => {
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
