# Phase 3A.5 — Project Persistence User Interface

## Release summary

Phase 3A.5 exposes the approved Phase 3A persistence system through a minimal project-management interface. The implementation uses the existing `TechStackProvider` operations exclusively: `saveProject`, `loadProject`, `listProjects`, and `deleteProject`. Presentational components do not call the API directly and contain no Supabase access.

The work was completed on the dedicated branch `feature/phase-3a-project-ui`, created from the approved Phase 3A.4 commit. The protected `main` branch was not modified and no merge was performed.

| Item | Result |
|---|---|
| Base branch | `feature/phase-3a-provider-persistence` |
| Base commit | `12c1c70e874cf66135336011a7e539230bd4bf2` |
| New branch | `feature/phase-3a-project-ui` |
| Release commit | Supplied in the final release metadata for the pushed branch |
| Persistence architecture | Existing provider → Next.js API → service → repository → Supabase |
| Authentication | Not implemented |
| New UI library | None |

## UI components and placement

The new `ProjectPersistenceToolbar` is placed in the existing sticky header action area. It presents the current project name when available, a subtle persistence status indicator, and clearly labeled **New**, **Open**, and **Save** actions. The existing sidebar, search control, GitHub link, theme control, navigation, and dashboard shell remain in place.

The Open Project flow uses the repository’s local accessible dialog primitive. It supports loading, empty, normal, and error states, and displays only safe project summary metadata: project name, description/domain context, and last-updated time. It does not show session identifiers, internal revisions, Supabase metadata, or unnecessary database identifiers.

Delete is available from each saved-project list entry and requires confirmation through the local alert-dialog primitive. The list is updated after successful deletion, and deleting the current project clears only the current persisted identity while preserving unrelated in-memory workflow state.

## Behavior

### Save Project

Save invokes `saveProject` from `TechStackProvider`, displays a loading state, prevents duplicate submissions, and updates the server-owned project ID and revision only from the API response. Successful saves expose a subtle saved state. Failed saves map to the provider’s safe error state and preserve the current in-memory project definition and selected architecture.

No auto-save or save-on-keystroke behavior was added.

### Open Project and project list

Open invokes `listProjects` through the provider. The dialog handles loading, empty, normal, and error states. Selecting a project invokes `loadProject`; the provider hydrates canonical project fields and recomputes derived analysis through the existing deterministic engine. The UI does not reconstruct persistence logic or restore persisted derived state.

### New Project

New Project uses the provider-level reset operation to clear the current in-memory project, canonical and derived workflow state, and server-owned identity without deleting any saved record. When canonical content has been modified since the last successful save, an accessible confirmation dialog warns the user before clearing local work. Clean projects reset immediately.

The Project Definition form now uses provider-controlled canonical state and its existing validation/analysis behavior. This avoids a second draft architecture and gives the toolbar a reliable distinction between saved/unchanged and modified state.

### Conflict handling

Revision conflicts are handled through the existing provider error code and safe recovery path. The UI explains that the saved version changed and offers reload of the current saved project when the current project identity is available, while still allowing the user to keep local work. There is no silent overwrite and no merge interface.

### Persistence status and errors

The toolbar represents the provider’s `idle`, `saving`, `saved`, `loading`, and `error` states with concise text and accessible status semantics. Safe provider error messages are displayed without exposing server internals. Local edits clear stale persistence errors and return the visible state to the appropriate unsaved/ready presentation.

## Responsive and accessibility work

The toolbar uses existing layout conventions and responsive utility classes. A 390×844 browser capture showed the Ready status and New/Open/Save controls contained within the mobile header rows without horizontal overflow. The dashboard banner and Project Definition section continued into the existing single-column mobile layout.

All critical actions have visible labels rather than icon-only affordances. The Open and New flows use accessible dialog primitives with named actions, visible focus-compatible controls, destructive confirmation for deletion/new-project clearing, and Escape-to-close behavior. Loading and status text is exposed through the toolbar’s accessible status treatment.

## Tests and verification

The new pure UI-state helper is covered by `tests/project-persistence-ui-state.test.mjs`. The tests cover Save enablement, duplicate-submission blocking, loading status, saved/modified labels, save failure, New Project warning, project-list empty/ready/error states, safe metadata display, conflict recovery, delete confirmation, and readable status labels.

| Verification | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed with pnpm 11.23.0; no manifest or lockfile changes |
| `pnpm check` | Passed |
| `pnpm lint` | Passed with 8 pre-existing warnings and 0 errors |
| `pnpm test` | Passed: 83 tests |
| `node --test tests/project-persistence-ui-state.test.mjs` | Passed: 12 UI-state tests |
| `pnpm build` | Passed with Next.js 16.2.11/Turbopack |
| `git diff --check` | Passed |
| Security guards | Passed: no client Supabase imports, service-role key, session-ID display, or browser-bundle secret markers |
| Dependency guard | Passed: no `package.json`, `pnpm-lock.yaml`, or workspace configuration changes |

The lint warnings are unchanged repository warnings in the existing search, API, persistence client, test, and utility files. No new lint errors were introduced.

## Browser regression

The final production build was started on an isolated local port. The workspace loaded successfully, and the existing Project Definition, deterministic recommendations, Component Workspace, Validation Report, Recipe Catalog, Blueprint controls, and export-area controls remained available.

The browser regression verified the following behaviors without configured Supabase credentials:

| Browser check | Result |
|---|---|
| Open application and existing shell | Passed |
| Edit Project Definition | Passed; status changed to Unsaved changes |
| New Project warning and reset | Passed; warning appeared and reset returned the workspace to Ready |
| Open Project dialog | Passed; safe unavailable state displayed |
| Save failure handling | Passed; safe unavailable message displayed and local edits were preserved |
| Deterministic recommendations | Passed |
| Component selection | Passed; 22 compatible nodes selected |
| Validation | Passed; existing deterministic Needs Review result displayed |
| Recipes | Passed; five recipe matches displayed |
| Blueprint controls | Passed; Generate Custom Blueprint remained available |
| Mobile layout | Passed at 390×844; no project-control overflow |
| Keyboard dismissal | Passed; Escape closed Open Project |

Real persistence success flows could not be honestly exercised because `SUPABASE_URL` and the server service-role credential are not configured in the local environment. The following browser checks require a configured backend and real anonymous-session API path: successful Save, refresh and subsequent state restoration, normal project-list population, loading a saved record, successful Delete, disappearance after Delete, and a live revision-conflict response. These paths remain covered by the existing provider/repository/API tests and the new UI-state tests use deterministic state fixtures; no successful persistence result was fabricated in the browser.

## Security and scope confirmation

The provider remains the only React-facing persistence boundary. No component imports Supabase or the server persistence factory. No service-role key or Supabase URL was found in browser bundles. No session ID is stored in provider UI state or displayed in the project list. Server-owned identity and revisions remain controlled by API responses, and delete targeting remains enforced by the existing server scope boundary.

No authentication, accounts, sharing, collaboration, billing, teams, comments, realtime behavior, auto-save, search/filtering/pagination, or additional product feature was added. No new UI dependency was introduced. The deterministic recommendation, validation, recipe, blueprint, export, and registry systems were not modified.

## Release status and risks

The remaining operational risk is environmental: the browser cannot verify successful persistence until the deployment environment has the required server-side Supabase configuration. The UI intentionally exposes that condition as a safe unavailable/error state and leaves local work intact. A follow-up phase may add credentialed end-to-end verification only with explicit approval.

The exact release commit is supplied in the final release metadata for the pushed branch. The branch must be pushed without merging into `main`. Work stops after Phase 3A.5; Phase 3A.6 has not started.
