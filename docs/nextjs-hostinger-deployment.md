# Next.js Hostinger Deployment Requirements

## Canonical application

The canonical frontend is the Next.js application rooted at the repository root. Its route entrypoint is `app/`, its reusable UI is under `components/`, its product state is under `context/`, its deterministic engines are under `engine/`, and its static assets are under `public/`. The legacy static frontend remains under `ui/` for historical and reference purposes, but it is no longer selected by a root redirect after this branch’s change.

## Required application root

Set the application/root directory to the **repository root**, the directory containing `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `app/`, `components/`, `public/`, and `ui/`.

Do not set `ui/` as the application root. It is a separate legacy static frontend and is not the canonical application.

## Required runtime

Run the application as a **Node.js application**. The repository declares:

| Requirement | Value |
|---|---|
| Node.js version | Node.js **20.9 or newer**, as documented by the repository README |
| Package manager | pnpm, using the committed `pnpm-lock.yaml` |
| Framework | Next.js `16.2.4` |
| Default port | `3000`, unless `PORT` is set |

The repository does not declare `.nvmrc` or `.node-version`, so the Node version must be selected in the hosting environment rather than inferred from a version file.

## Required commands

Run the following commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

These correspond to the existing package scripts:

| Stage | Exact command | Purpose |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | Installs the committed dependency graph without changing the lockfile. |
| Build | `pnpm build` | Runs `next build` and creates the production `.next/` output. |
| Start | `pnpm start` | Runs `next start` to serve the production application. |

The repository’s `dev` command is `next dev` and is for development only. The `legacy:dev` command uses `http-server` for the separate `ui/` frontend and must not be used as the production command for the canonical Next.js application.

## Output and public directories

A static output/public directory is **not applicable** to the standard server deployment used by this repository. Do not convert the application to static HTML and do not configure Hostinger to publish `ui/` or a copied HTML directory as the production document root.

The standard Next.js server needs the generated `.next/` directory after `pnpm build`, the repository’s `public/` directory for static assets, the application source and configuration needed by the build/runtime, and the installed Node.js dependencies. The normal production process is `pnpm start`.

## Why the current deployment is incorrect

The previous root `index.html` redirected to `ui/index.html`, so a static deployment of the repository root selected the legacy frontend. The deployment log also showed Composer installation and publishing without a Next.js build. That workflow does not run the canonical Next.js application.

The production deployment must therefore be changed from a Composer/static publish flow to a Node.js process flow using the commands above. This repository change removes only the root redirect entrypoint; it does not configure Hostinger’s control panel or deployment service.

## Hostinger changes that must be made manually

The hosting deployment must be configured to use a Node.js application rooted at the repository root, with Node.js 20.9 or newer, the frozen-lockfile install command, `pnpm build` as the build command, and `pnpm start` as the start command. The process must listen on the hosting-provided `PORT` when Hostinger supplies one.

The exact Hostinger panel labels and available Node.js process options are hosting-provider settings and are not declared by this repository. They must be selected or entered manually in Hostinger. The important invariant is that the deployment runs the standard Next.js build and start lifecycle instead of Composer-only installation and static publishing.

## Legacy frontend access

The `ui/` directory remains available for historical/reference use. Its existing compatibility workflow is:

```bash
pnpm legacy:dev
```

This is intentionally separate from the canonical production workflow. Deprecating or removing the legacy frontend would require a later, separately approved task because the root static workflow and legacy audit script still reference it.

## Verification note

On the deployment-fix branch, the built production server rendered the canonical Tech Stack Architect workspace at `/` with HTTP 200 on port 3101. The response contained the product title and `Component Workspace` content, and did not contain the former root redirect markers. `/content-detail` also returned HTTP 200. The required AI Document Q&A Platform fields were populated in the browser smoke test, confirming the canonical application is the Next.js workflow rather than the legacy static UI.

The browser smoke test completed from `http://127.0.0.1:3101/`: the root rendered the Next.js Tech Stack Architect workspace, the AI Document Q&A Platform fields were accepted, Analyze Project produced deterministic recommendations, and Add All Compatible produced the selected stack, recipe matches, and validation report. This confirms the main workflow remains functional after the entrypoint change.
