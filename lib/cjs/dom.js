"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addScript = void 0;
function addScript() {
    var scriptElementId = "npm-source-map";
    return new Promise(function (resolve, reject) {
        try {
            if (!document.getElementById(scriptElementId)) {
                var script = document.createElement("script");
                script.setAttribute("id", scriptElementId);
                script.src = "https://unpkg.com/source-map@0.7.3/dist/source-map.js";
                script.onload = function () {
                    window.sourceMap.SourceMapConsumer.initialize({
                        "lib/mappings.wasm": "https://cdn.jsdelivr.net/npm/source-map@0.7.3/lib/mappings.wasm"
                    });
                    resolve();
                };
                document.head.append(script);
            }
        }
        catch (_a) {
            reject();
        }
    });
}
exports.addScript = addScript;
