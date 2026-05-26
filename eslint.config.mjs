import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["lib/**", "docs/**", "node_modules/", "**/vendor/*.js"]
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx,js,mjs,cjs}"],
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        rules: {
            "sort-imports": [
                "error",
                {
                    allowSeparatedGroups: true
                }
            ]
        }
    },
    {
        files: ["**/*.test.{ts,tsx,js}", "**/*.spec.{ts,tsx,js}"],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        },
        rules: {
            "no-undef": "off",
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
]);
