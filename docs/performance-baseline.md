# Performance baseline

**Measured:** October 4, 2026  
**Build:** Phase 4 hygiene branch, production build from the audited repository state  
**Runner:** GitHub Actions `ubuntu-latest`, Node 22, pnpm 11.23.0  
**Audit:** Lighthouse mobile emulation, performance category only

The baseline was captured against a clean `pnpm build` followed by `pnpm start`. The workflow is retained at `.github/workflows/lighthouse-baseline.yml` so the same three routes can be re-measured consistently.

| Route | Performance score | LCP | TBT | CLS | INP |
|---|---:|---:|---:|---:|---:|
| `/` | 88 | 2,432 ms | 298 ms | 0.000 | Not reported |
| `/technologies/nextjs` | 95 | 2,164 ms | 145 ms | 0.000 | Not reported |
| `/app` | 90 | 2,229 ms | 296 ms | 0.000 | Not reported |

## Interpretation

- Public-page LCP is below the audit target of 2.5 s on both measured public routes.
- CLS is 0.000 on all three routes.
- Lighthouse did not return a lab INP value in this run, so the 200 ms INP target is not claimed as verified.
- TBT is 298 ms on the landing page and 296 ms on the workspace. TBT is not the same metric as INP, but it identifies the workspace/client shell as the heavier execution surface.
- The workspace remains intentionally `noindex`; its performance is tracked for user experience rather than search ranking.

## Before/after note

The audit requested lazy-loading Recharts and Motion if the workspace proved heavy. The current baseline does not provide an INP measurement showing a failure of the requested target, and the measured workspace LCP/CLS are healthy. No speculative component rewrite was introduced in this phase. The next performance pass should use field INP data before changing the workspace's animation/chart architecture.

## Re-running

The Lighthouse workflow builds the application locally in CI and audits:

1. `/`
2. `/technologies/nextjs`
3. `/app`

It also uploads the raw Lighthouse JSON reports as a workflow artifact.
