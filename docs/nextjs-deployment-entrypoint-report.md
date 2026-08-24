# Next.js Deployment Entrypoint Fix Report

## Executive Summary

The repository’s canonical frontend is the migrated Next.js + Shadcn Tech Stack Architect application, but the repository root still contained a static `index.html` that redirected browsers to `ui/index.html`. A static deployment of the repository root therefore opened the legacy frontend instead of the canonical Next.js application. Hostinger’s observed deployment log also showed a Composer-only install and publish flow with no Next.js build or Node.js start process.

The minimal safe fix was applied on a dedicated branch created from the current `main` branch:

> `fix/nextjs-deployment-entrypoint`

The root redirect file was removed. The legacy `ui/` frontend was preserved. No business logic, features, AI, database, authentication, persistence, backend service, external API, billing, collaboration, or application redesign was introduced. Nothing was merged into `main`.

## 1. Exact Cause of the Deployment Problem

The root `index.html` contained both of the following legacy redirects:

```html
<meta http-equiv="refresh" content="0; url=ui/index.html">
```

```js
window.location.replace("ui/index.html");
```

When a static host published the repository root, the browser loaded this file and immediately selected `ui/index.html`. This made the legacy static frontend the default application entrypoint even though the canonical product was the Next.js application under `app/`.

The observed Hostinger deployment log compounded the issue by cloning `main`, installing Composer dependencies, and publishing without running a Next.js build. That process does not execute `next build` or `next start`, so it cannot serve the canonical Next.js application.

## 2. Files Inspected

The following repository areas and files were inspected on `origin/main` before making the change:

| Area or file | Finding |
|---|---|
| `app/` | Canonical Next.js App Router application, including the workspace and documentation routes. |
| `components/` | Canonical reusable Shadcn and Tech Stack Architect UI components. |
| `context/` | Canonical in-memory product state/provider layer. |
| `engine/` | Canonical deterministic recommendation, dependency, validation, recipe, and export logic. |
| `data/` | Canonical static registries and product documentation data. |
| `public/` | Next.js public static assets. |
| `package.json` | `next`, `build`, `start`, `dev`, `legacy:dev`, `packageManager`, and Node-related project scripts. |
| `pnpm-lock.yaml` | Committed pnpm dependency lockfile. |
| `next.config.ts` | Standard Next.js configuration with no static export configuration. |
| `ui/` | Preserved legacy static frontend, including `ui/index.html`, `ui/app.js`, `ui/style.css`, and supporting files. |
| root `index.html` | Legacy redirect to `ui/index.html`; removed on this branch. |
| `README.md` | Documents Next.js as the primary application and `pnpm legacy:dev` as the explicitly named compatibility command. |
| `test_links.js` | Audits legacy `ui/` links and does not depend on the root `index.html`. |
| `next.config.ts` and deployment-related files | No Dockerfile, Procfile, Hostinger-specific config, static export config, `.nvmrc`, or `.node-version` was present. |

## 3. Files Changed

Only the following files were changed on the deployment-fix branch:

| File | Change |
|---|---|
| `index.html` | Removed the legacy static redirect so a repository-root static entrypoint no longer selects `ui/index.html`. Next.js now owns `/` when run with the repository’s standard production commands. |
| `docs/nextjs-hostinger-deployment.md` | Added exact repository-derived Node.js deployment requirements and the manual Hostinger configuration requirements. |
| `docs/nextjs-deployment-entrypoint-report.md` | Added this final report. |

No runtime application source files, product engines, registries, UI components, package scripts, dependencies, or Next.js configuration were changed.

## 4. Root `index.html` Status

The root `index.html` was **removed**. This was safe because the canonical production entrypoint is the Next.js App Router at `/`, served through `next start`, while the legacy static workflow is explicitly named `pnpm legacy:dev` and the legacy audit script directly references `ui/index.html` rather than the root redirect.

Removing the root redirect does not delete or modify `ui/`; it only prevents a static root redirect from masking the canonical Next.js application.

## 5. `ui/` Preservation

The entire legacy `ui/` directory was preserved. `ui/index.html` remains present, and its supporting static frontend files remain available for historical/reference purposes and for the explicit compatibility workflow.

The root static redirect was the only legacy entrypoint removed. No legacy files were copied into the Next.js app, converted to vanilla HTML, or replaced with the migrated Shadcn UI.

## 6. Deployment Configuration Changes

No Hostinger-specific deployment configuration was added because none was present in the repository and the task explicitly prohibited inventing provider settings. No package scripts or Next.js configuration were changed.

The repository change is limited to removing the obsolete root redirect. Hostinger’s deployment mode must still be changed manually from the observed Composer/static publish flow to a Node.js application flow.

## 7. Exact Hostinger Runtime Requirements

The following requirements are derived from the repository’s actual structure and scripts:

| Requirement | Exact value |
|---|---|
| Application/root directory | Repository root: the directory containing `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `app/`, `components/`, `public/`, and `ui/`. |
| Application type | Node.js application running the standard Next.js server. |
| Node.js version | Node.js 20.9 or newer, as stated in `README.md`. |
| Package manager | pnpm 11.21.0, as declared by the repository’s `packageManager` field. |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` — runs `next build`. |
| Start command | `pnpm start` — runs `next start`. |
| Default port | `3000`; the application also respects a hosting-provided `PORT` value. |
| Static output/public directory | Not applicable for the standard Node.js deployment. Do not publish `ui/` or convert the app to static HTML. |
| Build output | Next.js `.next/` output generated by `pnpm build`; the repository’s `public/` directory supplies static assets. |

The `dev` command (`next dev`) is for development only. The `legacy:dev` command uses `http-server` for the separate legacy frontend and must not be used as the canonical production start command.

## 8. Build Result

`pnpm build` passed on the deployment-fix branch. Next.js 16.2.4 compiled successfully, completed TypeScript checks, collected page data, generated static pages, and reported these application routes:

| Route | Build status |
|---|---|
| `/` | Static route generated |
| `/content-detail` | Static route generated |
| `/layout/footer` | Static route generated |
| `/layout/vertical/sidebar/buy-now` | Static route generated |
| `/_not-found` | Generated |

## 9. Test Result

`pnpm test` passed with **18 tests passed and 0 failed**. The test suite continued to cover dependencies, conflict detection, hardware pin conflicts, security rules, dependency resolution, recipe scoring, blueprint generation, project-definition validation, recommendation analysis, deterministic behavior, and export output.

## 10. Lint Result

`pnpm lint` completed with **0 errors** and **2 existing warnings**:

| Warning | Status |
|---|---|
| Missing `searchItems` dependency in the shared search component `useMemo` | Existing, non-blocking, unrelated to the entrypoint change. |
| Unused caught error variable in `test_links.js` | Existing, non-blocking, unrelated to the entrypoint change. |

No lint errors were introduced by this fix.

## 11. Type-Check Result

`pnpm check` passed. The TypeScript compiler completed with no type errors.

## 12. Production Start Result

The built application started successfully with the existing `pnpm start` script on an isolated port using `PORT=3101`.

| Smoke check | Result |
|---|---|
| Production server startup | Passed; `next start` reported ready. |
| `/` | HTTP 200. The response rendered the canonical Tech Stack Architect workspace. |
| `/content-detail` | HTTP 200. The documentation route rendered successfully. |
| Root redirect markers | Absent from the canonical root response; no `meta` refresh or `ui/index.html` redirect was present. |
| Canonical content markers | Present, including `Ediccrew Tech Stack Architect` and `Component Workspace`. |
| Main workflow | Passed; project fields were populated, Analyze Project produced deterministic recommendations, and Add All Compatible populated the selected stack, recipes, and validation report. |

## 13. Remaining Hostinger Configuration That Must Be Changed Manually

Hostinger must manually switch the deployment from the current Composer/static publish workflow to a Node.js application process. The hosting configuration must use the repository root, Node.js 20.9 or newer, `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm start`. If Hostinger provides a runtime port, it must be supplied through `PORT` to the Node.js process.

The exact Hostinger control-panel field names and provider-specific process settings are not declared in this repository and were not invented. The operational requirement is that Hostinger executes the standard Next.js build and start lifecycle rather than Composer-only installation and static publishing.

No static public/output directory should be configured as the canonical application entrypoint. The `ui/` directory must not be selected as the deployed application root.

## Conclusion

The deployment architecture problem was caused by the root static redirect and the absence of a Next.js build/start process in the observed Hostinger deployment. The minimal repository fix is complete on the isolated branch `fix/nextjs-deployment-entrypoint`: the root redirect was removed, `ui/` was preserved, the Next.js application remained canonical, and all required verification checks passed.

Nothing was merged into `main`.
