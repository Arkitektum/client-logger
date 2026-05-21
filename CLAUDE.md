# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build       # compile TypeScript to lib/cjs/ (CommonJS, ES5 target)
npm run clean       # remove lib/ directory
```

There are no test or lint scripts configured.

## Architecture

`client-logger` is a small TypeScript library (4 source files) that captures client-side browser errors and POSTs them to a backend API. It is published to npm and consumed by frontend apps.

**Entry point**: `src/index.ts` exports the `ClientLogger` class.

**Initialization pattern**: Async static factory — callers use `await ClientLogger.create(config)` rather than `new ClientLogger()`. On creation it:
1. Generates or restores a `sessionId` from `sessionStorage`
2. Injects the `source-map` library into the DOM via a CDN script tag (`src/dom.ts`)
3. Registers a `window.onerror` handler that captures uncaught errors and calls the configured endpoint

**Error processing pipeline** (`src/functions.ts`):
- `getErrorDataFromError()` — extracts stack from a JS `Error` object
- `getErrorDataFromSourceMap()` — uses `window.sourceMap` to resolve minified positions back to original source
- `getErrorDataFromStack()` — regex parses raw stack strings when no source map is available

**Log enrichment**: Every outgoing log payload (`LogMessage`) is automatically annotated with `appName`, `sessionId`, and a `clientInfo` block (`userAgent`, `vendor`, `platform`, `cookieEnabled`).

**Custom fields**: `LogMessage` accepts an optional `custom_fields` array of `{ key: string; value: string }` objects. These are forwarded as-is to the backend alongside the enriched fields.

```ts
clientLogger.postLogData([{
    message: "Something failed",
    custom_fields: [
        { key: "userId", value: "abc123" },
        { key: "feature", value: "checkout" }
    ]
}]);
```

**Build output**: `lib/cjs/` — CommonJS modules targeting ES5 for broad browser compatibility. Type declarations are emitted alongside JS.

## Versioning and publishing

Version is bumped manually in `package.json`. A GitHub Actions workflow (`.github/workflows/publish.yml`) handles npm publishing on release. There is also a CodeQL scan workflow.
