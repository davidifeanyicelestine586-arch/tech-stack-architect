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
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);
