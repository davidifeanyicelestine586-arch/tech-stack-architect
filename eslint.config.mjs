import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";

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
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);
