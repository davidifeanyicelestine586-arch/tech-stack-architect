import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ANONYMOUS_SESSION_COOKIE,
  createProjectApi,
} from "../lib/persistence/api/project-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";

const readJson = (path) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));

const registries = {
  domains: readJson("../data/domain.json"),
  components: readJson("../data/components.json"),
  recipes: readJson("../data/recipes.json"),
};

const sessionA = "11111111-1111-4111-8111-111111111111";
const sessionB = "22222222-2222-4222-8222-222222222222";
const baseSnapshot = {
  schemaVersion: 1,
  projectDefinition: {
    name: "AI Document Q&A Platform",
    description: "A SaaS application for document questions.",
    domain: "web-saas",
    difficulty: "Intermediate",
    requirements: "upload PDFs, ask questions, deploy",
  },
  selectedComponentIds: ["nextjs", "nodejs", "vercel"],
  activeRecipeId: "bootstrapped-payment-dashboard",
};

const readResponse = async (response) => ({
  status: response.status,
  body: await response.json(),
  cookie: response.headers.get("set-cookie") || "",
});

const request = (method, body, url = "http://localhost/api/projects") =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const cookieStore = (value) => ({
  get(name) {
    return name === ANONYMOUS_SESSION_COOKIE && value
      ? { name, value }
      : undefined;
  },
});

const context = (id) => ({ params: Promise.resolve({ id }) });

class ApiService {
  constructor() {
    this.records = new Map();
    this.nextId = 0;
    this.calls = [];
    this.failWith = null;
  }

  scopeKey(scope) {
    return scope.kind === "anonymous" ? scope.sessionId : scope.userId;
  }

  assertOwned(scope, id) {
    const record = this.records.get(id);
    if (!record || record.scopeKey !== this.scopeKey(scope)) {
      throw new PersistenceError("PERSISTENCE_NOT_FOUND", "Project not found.");
    }
    return record;
  }

  async createProject({ scope, snapshot }) {
    this.calls.push({ operation: "create", scope, snapshot });
    if (this.failWith) throw this.failWith;
    this.nextId += 1;
    const id = `00000000-0000-4000-8000-${String(this.nextId).padStart(12, "0")}`;
    const record = {
      id,
      scopeKey: this.scopeKey(scope),
      revision: 1,
      snapshot,
    };
    this.records.set(id, record);
    return record;
  }

  async listProjects({ scope }) {
    this.calls.push({ operation: "list", scope });
    if (this.failWith) throw this.failWith;
    return [...this.records.values()]
      .filter((record) => record.scopeKey === this.scopeKey(scope))
      .map(({ scopeKey, ...record }) => record);
  }

  async getProject({ scope, id }) {
    this.calls.push({ operation: "get", scope, id });
    if (this.failWith) throw this.failWith;
    const { scopeKey, ...record } = this.assertOwned(scope, id);
    return record;
  }

  async updateProject({ scope, id, expectedRevision, snapshot }) {
    this.calls.push({ operation: "update", scope, id, expectedRevision, snapshot });
    if (this.failWith) throw this.failWith;
    const record = this.assertOwned(scope, id);
    if (record.revision !== expectedRevision) {
      throw new PersistenceError("PERSISTENCE_CONFLICT", "Project revision is stale.");
    }
    record.revision += 1;
    record.snapshot = snapshot;
    const { scopeKey, ...updated } = record;
    return updated;
  }

  async deleteProject({ scope, id }) {
    this.calls.push({ operation: "delete", scope, id });
    if (this.failWith) throw this.failWith;
    this.assertOwned(scope, id);
    this.records.delete(id);
    return true;
  }
}

const createApi = (service, session = null, options = {}) =>
  createProjectApi({
    service,
    registries,
    getCookieStore: async () => cookieStore(session),
    isProduction: options.isProduction ?? true,
    logger: options.logger ?? null,
  });

test("a request cannot supply its own anonymous session ID", async () => {
  const service = new ApiService();
  const api = createApi(service, sessionA);
  const result = await readResponse(
    await api.create(request("POST", { sessionId: sessionB, snapshot: baseSnapshot }))
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
  assert.equal(service.calls.length, 0);
});

test("a query-string session ID is ignored and never becomes the persistence scope", async () => {
  const service = new ApiService();
  const api = createApi(service, null);
  const result = await readResponse(
    await api.create(
      request(
        "POST",
        { snapshot: baseSnapshot },
        `http://localhost/api/projects?sessionId=${sessionB}`
      )
    )
  );

  assert.equal(result.status, 200);
  assert.equal(service.calls[0].scope.kind, "anonymous");
  assert.notEqual(service.calls[0].scope.sessionId, sessionB);
  assert.match(result.cookie, /HttpOnly/);
  assert.match(result.cookie, /Secure/);
});

test("a new anonymous request receives a secure, HTTP-only, path-scoped cookie", async () => {
  const service = new ApiService();
  const api = createApi(service, null, { isProduction: true });
  const result = await readResponse(await api.create(request("POST", { snapshot: baseSnapshot })));

  assert.equal(result.status, 200);
  assert.match(result.cookie, new RegExp(`^${ANONYMOUS_SESSION_COOKIE}=`));
  assert.match(result.cookie, /HttpOnly/);
  assert.match(result.cookie, /SameSite=Lax/);
  assert.match(result.cookie, /Secure/);
  assert.match(result.cookie, /Path=\/api\/projects/);
  assert.match(result.cookie, /Max-Age=2592000/);
  assert.equal(JSON.stringify(result.body).includes("sessionId"), false);
});

test("one anonymous session cannot access another session's project", async () => {
  const service = new ApiService();
  const ownerApi = createApi(service, sessionA);
  const created = await readResponse(
    await ownerApi.create(request("POST", { snapshot: baseSnapshot }))
  );
  const projectId = created.body.data.id;
  const otherApi = createApi(service, sessionB);
  const result = await readResponse(await otherApi.get(context(projectId)));

  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "PERSISTENCE_NOT_FOUND");
});

test("one anonymous session cannot update another session's project", async () => {
  const service = new ApiService();
  const ownerApi = createApi(service, sessionA);
  const created = await readResponse(
    await ownerApi.create(request("POST", { snapshot: baseSnapshot }))
  );
  const otherApi = createApi(service, sessionB);
  const result = await readResponse(
    await otherApi.update(
      request("PATCH", { snapshot: baseSnapshot, expectedRevision: 1 }),
      context(created.body.data.id)
    )
  );

  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "PERSISTENCE_NOT_FOUND");
});

test("one anonymous session cannot delete another session's project", async () => {
  const service = new ApiService();
  const ownerApi = createApi(service, sessionA);
  const created = await readResponse(
    await ownerApi.create(request("POST", { snapshot: baseSnapshot }))
  );
  const otherApi = createApi(service, sessionB);
  const result = await readResponse(await otherApi.remove(context(created.body.data.id)));

  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "PERSISTENCE_NOT_FOUND");
  assert.equal(service.records.has(created.body.data.id), true);
});

test("invalid project IDs are rejected before reaching the service", async () => {
  const service = new ApiService();
  const api = createApi(service, sessionA);
  const result = await readResponse(await api.get(context("not-a-uuid")));

  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, "VALIDATION_FAILURE");
  assert.equal(service.calls.length, 0);
});

test("invalid snapshots are rejected before reaching the service", async () => {
  const service = new ApiService();
  const api = createApi(service, sessionA);
  const result = await readResponse(
    await api.create(
      request("POST", {
        snapshot: {
          ...baseSnapshot,
          projectDefinition: { ...baseSnapshot.projectDefinition, name: "" },
        },
      })
    )
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, "VALIDATION_FAILURE");
  assert.equal(service.calls.length, 0);
});

test("stale revisions return a stable conflict response", async () => {
  const service = new ApiService();
  const api = createApi(service, sessionA);
  const created = await readResponse(
    await api.create(request("POST", { snapshot: baseSnapshot }))
  );
  const result = await readResponse(
    await api.update(
      request("PATCH", { snapshot: baseSnapshot, expectedRevision: 0 }),
      context(created.body.data.id)
    )
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, "VALIDATION_FAILURE");

  const conflict = await readResponse(
    await api.update(
      request("PATCH", { snapshot: baseSnapshot, expectedRevision: 2 }),
      context(created.body.data.id)
    )
  );
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.error.code, "PERSISTENCE_CONFLICT");
  assert.match(conflict.body.error.message, /changed elsewhere|Reload/);
});

test("raw database errors are mapped to safe client responses", async () => {
  const service = new ApiService();
  service.failWith = new Error("postgres password and stack trace must not escape");
  const logs = [];
  const api = createApi(service, sessionA, { logger: (error) => logs.push(error) });
  const result = await readResponse(await api.list());

  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, "DATABASE_FAILURE");
  assert.equal(result.body.error.message.includes("postgres"), false);
  assert.equal(JSON.stringify(result.body).includes("stack trace"), false);
  assert.equal(logs.length, 1);
});

test("service-role credentials are not exposed in API responses", async () => {
  const service = new ApiService();
  service.failWith = new Error("SUPABASE_SERVICE_ROLE_KEY=secret-value");
  const api = createApi(service, sessionA);
  const response = await api.list();
  const text = await response.text();

  assert.equal(response.status, 503);
  assert.equal(text.includes("secret-value"), false);
  assert.equal(text.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
});

test("authentication is not required for anonymous project creation", async () => {
  const service = new ApiService();
  const api = createApi(service, null, { isProduction: false });
  const result = await readResponse(
    await api.create(request("POST", { snapshot: baseSnapshot }))
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.match(result.cookie, /HttpOnly/);
  assert.equal(result.cookie.includes("Secure"), false);
  assert.equal(service.calls[0].scope.kind, "anonymous");
});
