import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

const tsTypeAware = tseslint.configs.recommendedTypeChecked.map((c) => ({
  ...c,
  files: ["src/**/*.ts", "tests/**/*.ts"],
  languageOptions: {
    ...c.languageOptions,
    ecmaVersion: "latest",
    sourceType: "module",
    globals: { ...globals.node },
    parserOptions: {
      ...(c.languageOptions?.parserOptions ?? {}),
      project: ["./tsconfig.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
}));

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "prisma/migrations/**",
      "eslint.config.js",
    ],
  },
  {
    files: [
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "*.config.*",
      "scripts/**/*.{js,ts}",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    ...js.configs.recommended,
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
    },
  },
  ...tsTypeAware,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    rules: {
      eqeqeq: ["error", "always"],
      "prefer-const": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  eslintConfigPrettier,
];
