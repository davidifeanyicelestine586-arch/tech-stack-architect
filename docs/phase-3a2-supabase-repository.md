# Phase 3A.2 — Supabase Schema and Persistence Repository

This phase adds the database foundation only. It does not connect persistence to the React UI, replace `TechStackProvider`, add API routes, add authentication, or change the deterministic engines and static registries.

## Scope

The implementation contains one PostgreSQL table, a server-side Supabase client factory, a project repository, a persistence service boundary, and unit tests using an in-memory Supabase-shaped adapter. Project state is validated and serialized through the Phase 3A.1 contracts.

The canonical persisted fields remain:

- `name`
- `description`
- `domain`
- `difficulty`
- `requirements`
- `selectedComponentIds`
- `activeRecipeId`
- `schemaVersion`

Recommendations, validation reports, recipe scores, blueprints, exports, and UI state remain derived and are not persisted.

## Database Schema

The migration is `supabase/migrations/20260824000000_create_projects.sql`. It creates only `public.projects` with:

| Column | PostgreSQL type | Purpose |
|---|---|---|
| `id` | `uuid` | Stable generated project ID. |
| `owner_id` | `uuid nullable` | Future authenticated owner hook referencing `auth.users`; authentication is not implemented. |
| `anonymous_session_id` | `uuid nullable` | Server-managed anonymous session scope. |
| `name` | `text` | Required canonical project name. |
| `description` | `text` | Required canonical project description. |
| `domain_id` | `text` | Static domain registry ID. |
| `difficulty` | `text` | Allowlisted current difficulty value. |
| `requirements` | `text` | Canonical free-form requirements. |
| `selected_component_ids` | `text[]` | Static component registry IDs selected by the user. |
| `active_recipe_id` | `text nullable` | Optional static recipe registry ID. |
| `schema_version` | `smallint` | Current snapshot version, fixed at `1`. |
| `revision` | `bigint` | Optimistic update revision. |
| `created_at` | `timestamptz` | Server-owned creation timestamp. |
| `updated_at` | `timestamptz` | Server-owned modification timestamp. |

The migration adds owner/session indexes, a timestamp trigger, and constraints for scope, required text, difficulty, schema version, and positive revision. RLS is enabled. Direct `anon` and `authenticated` table privileges are revoked, and no broad anonymous RLS policy is created.

## Server Boundary

The intended boundary is:

```text
Future UI or API/server action
  ↓
ProjectPersistenceService
  ↓
ProjectRepository
  ↓
Server-side Supabase client
  ↓
public.projects
```

`lib/persistence/supabase/server.ts` creates a Supabase client from server-only variables. It must not be imported by client components. The service-role key is never accepted from request payloads and must never use a `NEXT_PUBLIC_` prefix.

The repository requires a validated `PersistenceScope` for every create, read, list, update, and delete operation. Anonymous operations use `anonymous_session_id` with `owner_id IS NULL`; future authenticated operations use `owner_id` with `anonymous_session_id IS NULL`. Out-of-scope records are not returned.

## Repository Operations

`ProjectRepository` implements:

- `createProject`
- `getProject`
- `listProjects`
- `updateProject`
- `deleteProject`

The repository accepts the Phase 3A.1 snapshot contract, validates static registry references, serializes the canonical fields, and deserializes returned rows. It does not run recommendation, validation, recipe, blueprint, or export business logic.

Updates first verify the current revision and then perform a scoped conditional update matching `id` and `revision`. A stale revision returns a typed `PERSISTENCE_CONFLICT` error rather than silently overwriting newer data.

## Typed Errors

Persistence errors are mapped to stable codes including validation failure, unauthorized/invalid scope, not found, conflict, database failure, malformed record, persistence unavailable, unsupported schema version, and configuration failure. Raw Supabase/database messages are retained only on the server-side `internal` field for logging and are not exposed in user-facing error messages.

## Environment Variables

No credentials are included. When the server integration is eventually enabled, configure these variables outside Git:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
```

The current phase does not add a browser Supabase client or `NEXT_PUBLIC_SUPABASE_*` variables. It also does not alter Hostinger configuration or production environment variables.

## Tests

`tests/project-repository.test.mjs` uses a deterministic in-memory Supabase-shaped adapter. It covers repository create, get, list, update, delete, optimistic revision conflict, scope isolation, invalid scope and ID handling, invalid snapshot rejection, database error mapping, service delegation, registry validation during deserialization, and malformed rows.

No live Supabase credentials are required for the unit tests. Live integration tests remain a separate future concern.

## Explicit Non-Goals

Phase 3A.2 does not add authentication, user accounts, login/signup, AI, billing, collaboration, sharing, realtime, persistence UI, Save/Load buttons, auto-save, provider hydration, browser Supabase access, API route handlers, or deployment changes.

The existing Shadcn shell, `TechStackProvider`, routes, deterministic engines, static registries, exports, Hostinger setup, production URL, and `main` remain protected.
