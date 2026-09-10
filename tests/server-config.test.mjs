import assert from "node:assert/strict";
import test from "node:test";
import { getServerConfig, validateProductionConfig } from "../lib/config/server-config.js";

test("production configuration validation detects missing privileged Supabase settings", () => {
  const result = validateProductionConfig({ NODE_ENV: "production" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.missing, ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
});

test("server configuration validation accepts complete production settings", () => {
  const env = {
    NODE_ENV: "production",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "server-secret",
  };
  assert.deepEqual(getServerConfig(env), {
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  assert.deepEqual(validateProductionConfig(env), { valid: true, missing: [] });
});

test("development configuration validation does not require production secrets", () => {
  assert.deepEqual(validateProductionConfig({ NODE_ENV: "development" }), { valid: true, missing: [] });
});
