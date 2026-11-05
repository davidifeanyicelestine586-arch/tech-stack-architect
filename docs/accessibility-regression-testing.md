# Accessibility regression testing

The `Accessibility Regression` GitHub Actions workflow runs on pull requests, pushes to `main`, and manual dispatch. It builds the production app with local placeholder Supabase values, starts it locally, then runs `pnpm audit:a11y` with strict regression mode enabled. No production credentials or live account actions are used.

The Playwright/axe audit covers the public `/`, `/contact`, `/content-detail`, `/privacy`, and `/terms` routes; the public navigation closed/open when available; and the workspace `/app` closed, sign-in, sign-up, and toggled-sidebar states. It runs at 375, 390, 414, 768, 1024, and 1440 CSS pixels. Axe checks include WCAG 2 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA, and best-practice rules. Geometry checks report document overflow, horizontal clipping, and actionable-element intersections above the audit threshold.

In CI, `A11Y_AUDIT_FAIL_ON_FINDINGS=true` makes any axe violation or geometry finding fail the job. Axe incomplete checks are recorded for manual review but do not fail the job by themselves. The workflow uploads `remaining-audit.json`, `remaining-audit.md`, `remaining-audit.html`, screenshots, and the Next.js startup log as a 14-day artifact, even if the audit fails.

## Run locally

Install the browser once if it is not already available:

```bash
pnpm exec playwright install chromium
```

Build and start the app with placeholder public credentials in one terminal:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=playwright-audit-placeholder \
pnpm build

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=playwright-audit-placeholder \
pnpm start
```

Run the strict audit in another terminal:

```bash
A11Y_AUDIT_BASE_URL=http://127.0.0.1:3000 \
A11Y_AUDIT_OUTPUT_ROOT=playwright-report/application-accessibility/local \
A11Y_AUDIT_LABEL=local \
A11Y_AUDIT_FAIL_ON_FINDINGS=true \
pnpm audit:a11y
```

The HTML and Markdown reports, JSON results, and route/state screenshots are written beneath the selected output directory. `A11Y_AUDIT_LABEL` affects only the human-readable report headings; it does not change the measured results.
