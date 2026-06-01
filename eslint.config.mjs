import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client — never lint.
    "src/generated/**",
  ]),
  {
    rules: {
      // React 19 rule that flags legitimate "sync external state on mount" patterns
      // (theme from localStorage, push permission state, etc.) — downgrade to warning.
      "react-hooks/set-state-in-effect": "warn",
      // Many SWR/Pusher/Prisma payload sites legitimately use `any` at boundaries.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
