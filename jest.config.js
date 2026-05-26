/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "jsdom",
    testPathIgnorePatterns: ["/node_modules/", "/lib/"],
    testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.spec.ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: {
                    target: "ES2020",
                    module: "commonjs",
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    strict: true,
                    skipLibCheck: true,
                    lib: ["dom", "ES2020"],
                    types: ["jest", "node"]
                }
            }
        ]
    }
};
