# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build       # compile TypeScript to lib/cjs/ (CommonJS, ES2020 target)
npm run clean       # remove lib/ directory
npm test            # run jest unit tests (ts-jest + jsdom)
npm run lint        # run eslint
```

## Architecture

`client-logger` is a small TypeScript library (4 source files) that captures client-side browser errors and POSTs them to a backend API. It is published to npm and consumed by frontend apps.

**Entry point**: `src/index.ts` exports the `ClientLogger` class.

**Initialization pattern**: Async static factory — callers use `await ClientLogger.create(logApiUrl, sourceMapUrl, appName)` rather than `new ClientLogger()`. On creation it:
1. Injects the `source-map` library into the DOM via a CDN script tag (`src/dom.ts`)
2. Fetches and parses the source map JSON, then constructs a `SourceMapConsumer`
3. Generates or restores a `sessionId` from `sessionStorage`
4. Registers a `window.onerror` handler that captures uncaught errors and posts them to the configured endpoint

**Error processing pipeline** (`src/functions.ts`):
- `getErrorDataFromError()` — extracts the stack from a JS `Error`; uses a `SourceMapConsumer` if provided, otherwise falls back to regex-parsing the raw stack
- `getErrorDataFromSourceMap()` — used from the `window.onerror` handler; resolves minified positions via the `SourceMapConsumer` when available
- `getErrorDataFromStack()` (private) — regex extracts `source`, `line`, `column` from stack strings of the form `https://host/path/file.js:LINE:COL`

**Source map integration**: `src/dom.ts` defines the `SourceMapConsumer` interface used across the codebase and loads the mozilla `source-map` library from unpkg at runtime. `addScript()` is idempotent — if a `<script>` with id `npm-source-map` already exists it resolves immediately (when `window.sourceMap` is loaded) or waits for the existing script's `load`/`error` event.

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

**Nullable `originalPosition`**: `SourceMapConsumer.originalPositionFor()` returns `null` for any field it cannot resolve, so `LogMessage.originalPosition` is typed as `{ source: string | null; line: number | null; column: number | null; name: string | null }`. The fallback branches in `functions.ts` coerce `undefined` to `null` so both code paths produce the same shape.

**Build output**: `lib/cjs/` — CommonJS modules targeting ES2020. Type declarations are emitted to `lib/cjs/types/`. `*.test.ts` and `*.spec.ts` are excluded from the build via `configs/tsconfig.cjs.json`.

## Tests

Jest with `ts-jest` and the `jsdom` environment. Tests are co-located with source as `*.test.ts`. Configuration lives in `jest.config.js` (TypeScript options are inlined to avoid coupling to the build tsconfig).

What's covered:
- `src/generators.test.ts` — `createUUID` format and uniqueness
- `src/functions.test.ts` — both branches of `getErrorDataFromError` and `getErrorDataFromSourceMap`, stack-regex extraction, http/https URLs, missing stack/positions
- `src/dom.test.ts` — script element creation, promise resolution on `load`, idempotent behavior when the script already exists (resolves immediately if `window.sourceMap` is loaded; waits otherwise)
- `src/index.test.ts` — `ClientLogger.create`, session handling, `window.onerror` registration, consumer cleanup, `postLogData` enrichment + custom_fields + missing-URL warning, `getLogMessageFromError` merge behavior

## Linting

ESLint flat config in `eslint.config.mjs` covers `*.{ts,tsx,js,mjs,cjs}` with `typescript-eslint` recommended rules. Test files relax `no-undef` and `@typescript-eslint/no-explicit-any` (mocks frequently need `any`). Build output (`lib/**`) is in the ignore list.

## Versioning and publishing

Version is bumped manually in `package.json`. A GitHub Actions workflow (`.github/workflows/publish.yml`) handles npm publishing on release. There is also a CodeQL scan workflow.
