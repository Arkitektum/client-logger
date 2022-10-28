"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorDataFromSourceMap = exports.getErrorDataFromError = void 0;
function getErrorDataFromStack(error) {
    var _a, _b, _c, _d;
    var stackRegex = /(?<source>http.*?):(?<line>\d+):(?<column>\d+)/g;
    if (!!((_a = error === null || error === void 0 ? void 0 : error.stack) === null || _a === void 0 ? void 0 : _a.length)) {
        var stack = error.stack.toString();
        var matches = __spread(stack.matchAll(stackRegex));
        if (!!matches.length) {
            var matchGroup = (_b = matches === null || matches === void 0 ? void 0 : matches[0]) === null || _b === void 0 ? void 0 : _b.groups;
            var source = matchGroup === null || matchGroup === void 0 ? void 0 : matchGroup.source;
            return {
                source: source === null || source === void 0 ? void 0 : source.substring(source.lastIndexOf("/") + 1),
                line: ((_c = matchGroup === null || matchGroup === void 0 ? void 0 : matchGroup.line) === null || _c === void 0 ? void 0 : _c.length) ? parseInt(matchGroup === null || matchGroup === void 0 ? void 0 : matchGroup.line) : null,
                column: ((_d = matchGroup === null || matchGroup === void 0 ? void 0 : matchGroup.column) === null || _d === void 0 ? void 0 : _d.length) ? parseInt(matchGroup.column) : null
            };
        }
        else {
            return null;
        }
    }
    else {
        return null;
    }
}
function getErrorDataFromError(error, consumer) {
    var errorData = getErrorDataFromStack(error);
    if (consumer !== null && errorData !== null) {
        var originalPosition = consumer.originalPositionFor({ line: errorData.line, column: errorData.column });
        return {
            message: error.message,
            originalPosition: originalPosition
        };
    }
    return {
        message: error.message,
        originalPosition: {
            source: errorData === null || errorData === void 0 ? void 0 : errorData.source,
            line: errorData === null || errorData === void 0 ? void 0 : errorData.line,
            column: errorData === null || errorData === void 0 ? void 0 : errorData.column
        }
    };
}
exports.getErrorDataFromError = getErrorDataFromError;
function getErrorDataFromSourceMap(event, source, line, column, consumer) {
    if (consumer !== null && line !== undefined && column !== undefined) {
        var originalPosition = consumer.originalPositionFor({ line: line, column: column });
        return {
            message: event.toString(),
            originalPosition: originalPosition
        };
    }
    return {
        message: event.toString(),
        originalPosition: {
            column: column,
            line: line,
            source: source
        }
    };
}
exports.getErrorDataFromSourceMap = getErrorDataFromSourceMap;
