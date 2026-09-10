import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryForEvent,
  logSecurityEvent,
  SECURITY_EVENT_CATEGORIES,
  SECURITY_EVENT_LEVELS,
} from "../lib/security/logger.js";
import { createProjectApi, REQUEST_ID_HEADER } from "../lib/persistence/api/project-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";

const sessionId = "11111111-1111-4111-8111-111111111111";
const snapshot = {
  schemaVersion: 1,
  projectDefinition: {
    name: "Observability Test Project",
    description: "A valid project snapshot.",
    domain: "web-saas",
    difficulty: "Intermediate",
    requirements: "build and deploy",
  },
  selectedComponentIds: ["nextjs", "nodejs", "vercel"],
  activeRecipeId: "bootstrapped-payment-dashboard",
};

const registries = {
  domains: [{ id: "web-saas", name: "Web SaaS" }],
  components: ["nextjs", "nodejs", "vercel"].map((id) => ({ id, name: id })),
  recipes: [{ id: "bootstrapped-payment-dashboard", name: "Bootstrap" }],
};

const request = () => new Request("http://localhost/api/projects", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ snapshot }),
});

const service = {
  async createProject({ scope, snapshot: value }) {
    return { id: "00000000-0000-4000-8000-000000000001", scope, snapshot: value };
  },
};

const api = (logger) => createProjectApi({
  service,
  registries,
  getCookieStore: async () => ({ get: () => ({ value: sessionId }) }),
  isProduction: true,
  logger,
});

test("security events include stable level and category fields", () => {
  const originalWarn = console.warn;
  let output = "";
  console.warn = (value) => { output = value; };
  try {
    logSecurityEvent("project_api_guard_failure", { requestId: "req-123" });
  } finally {
    console.warn = originalWarn;
  }

  const entry = JSON.parse(output);
  assert.equal(entry.level, SECURITY_EVENT_LEVELS.WARN);
  assert.equal(entry.category, SECURITY_EVENT_CATEGORIES.PERSISTENCE);
  assert.equal(entry.requestId, "req-123");
});

test("event classification maps common security domains deterministically", () => {
  assert.equal(categoryForEvent("auth_session_refresh"), SECURITY_EVENT_CATEGORIES.AUTHENTICATION);
  assert.equal(categoryForEvent("admin_forbidden"), SECURITY_EVENT_CATEGORIES.AUTHORIZATION);
  assert.equal(categoryForEvent("project_api_guard_failure"), SECURITY_EVENT_CATEGORIES.PERSISTENCE);
  assert.equal(categoryForEvent("rate_limit_exceeded"), SECURITY_EVENT_CATEGORIES.REQUEST);
  assert.equal(categoryForEvent("supabase_config_failure"), SECURITY_EVENT_CATEGORIES.CONFIGURATION);
});

test("project API emits a correlation ID on successful responses", async () => {
  const response = await api(null).create(request());
  const requestId = response.headers.get(REQUEST_ID_HEADER);

  assert.equal(response.status, 200);
  assert.match(requestId, /^[0-9a-f-]{36}$/i);
});

test("project API includes the same correlation ID in guard logs and failure responses", async () => {
  const logs = [];
  const failingApi = createProjectApi({
    service: {
      async createProject() {
        throw new Error("database connection failure");
      },
    },
    registries,
    getCookieStore: async () => ({ get: () => ({ value: sessionId }) }),
    isProduction: true,
    logger: (error, context) => logs.push({ error, context }),
  });

  const response = await failingApi.create(request());
  const requestId = response.headers.get(REQUEST_ID_HEADER);

  assert.equal(response.status, 503);
  assert.match(requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].context.requestId, requestId);
  assert.equal(logs[0].context.code, "DATABASE_FAILURE");
  assert.equal(logs[0].context.status, 503);
});

test("known persistence errors are not duplicated as generic infrastructure logs", async () => {
  const logs = [];
  const failingApi = createProjectApi({
    service: {
      async createProject() {
        throw new PersistenceError("VALIDATION_FAILURE", "invalid snapshot");
      },
    },
    registries,
    getCookieStore: async () => ({ get: () => ({ value: sessionId }) }),
    isProduction: true,
    logger: (error, context) => logs.push({ error, context }),
  });

  const response = await failingApi.create(request());
  assert.equal(response.status, 400);
  assert.equal(logs.length, 0);
});
