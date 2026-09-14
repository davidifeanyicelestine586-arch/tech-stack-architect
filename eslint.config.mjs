import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import nextTypeScriptConfig from "eslint-config-next/typescript";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "engine/**",
    "ui/**",
  ]),
  ...nextConfig,
  ...nextTypeScriptConfig,
  {
    rules: {
      // Keep explicit-any visible during the cleanup without making the
      // existing repository-wide debt a build blocker in this pass.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);
