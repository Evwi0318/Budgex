# Phase 0 — Baseline audit

- **Date:** 2026-11-14
- **Commit audited:** `58dcbde` (main, after PR #74)
- **Scope:** read-only inspection. No application code was changed in this phase.

Findings are labelled **Confirmed** (proven by a test run or an unambiguous code path) or
**Potential** (plausible from the code, needs a reproducing test before it is called a bug).
Priorities: P0 release blocker, P1 important pre-launch, P2 after launch, P3 polish.

## 1. Baseline results

| Check | Command | Result |
|---|---|---|
| npm install | `npm ci` | OK |
| Dependency audit | `npm audit --audit-level=high` | Pass. 9 moderate (eslint → minimatch chain, dev-only) |
| Lint | `npm run lint` | Pass, 0 problems |
| Typecheck | `npx tsc -b --noEmit` | Pass |
| Unit tests | `npm run test` | 21/21 passed (3 files) |
| Build | `npm run build` | Pass. Warning: main chunk 555 kB (> 500 kB) |
| E2E | `npx playwright test` (Pixel 7 only) | 79/79 passed, 2.1 min |
| Backend build/test | `dotnet build/test` | **Not run locally** — the audit sandbox cannot reach dot.net or nuget.org. CI on GitHub runs these on every push; the last `main` run is the reference. |

## 2. Architecture overview (as built)

- **Backend:** .NET 10, Clean Architecture (`Domain` → `Application` → `Infrastructure` → `Api`),
  minimal-API endpoints, EF Core + Npgsql, ASP.NET Core Identity, JWT (15 min) + rotating
  hashed refresh token in an httpOnly cookie (60 days).
- **Domain model:** `Entry` (income/expense template with `From`/`To` month range) +
  `EntryMonthState` (per-month amount override, skipped, paid). `SavingsAccount` with
  `AllocationRule`s (fixed or percentage of a specific income entry) + `SavingsMonthState`
  (frozen amount + transferred flag). `Saved` is a running balance on the account.
- **Calculations:** `BudgetCalculator` (safe-to-spend = income − expenses − savings, not
  clamped), `MonthlyPlan` (resolves entries for a month), `SavingsPlan` (rule amounts, source
  usage with Ok/Full/Over status). Money is `decimal(18,2)`; percentage rules round to whole
  kronor, `MidpointRounding.AwayFromZero`; item-based accounts use `Math.Ceiling(sum/12)`.
- **Frontend:** React 19, Vite 8, Tailwind v4 `@theme` tokens, TanStack Query, separate
  `Home` (mobile) and `DesktopHome` (≥ 1024 px) pages. Access token in memory only.
- **Hosting:** Vercel (frontend, rewrites `/api/*` to the API), Google Cloud Run
  europe-west3 (API), Neon (Postgres). README and memory notes mentioning Azure are outdated.
- **CI:** `ci.yml` (backend build/test/NuGet audit, frontend audit/lint/typecheck/unit/build/e2e),
  `codeql.yml`, `deploy.yml`.

> **Important for the PR workflow:** `deploy.yml` deploys the API to Cloud Run on every push to
> `main`. Merging a PR is therefore a production deployment of the backend.

## 3. Financial logic

| # | Finding | Status | Priority | Location |
|---|---|---|---|---|
| F1 | Saving the savings form for an account **without a goal** sends `saved: null`, which erases the balance built up by "mark as transferred". | Confirmed (code path) | **P0** | `frontend/src/components/savings/SavingsForm.tsx:100`, `SavingsEndpoints.cs` PUT (`account.Saved = request.Saved`) |
| F2 | The savings form always writes back the `Saved` value it was opened with. A transfer made in another tab (or a stale cache) between opening and saving is silently overwritten (lost update). No concurrency token. | Potential | P1 | `SavingsEndpoints.cs` PUT, `SavingsAccount` |
| F3 | Undoing a transfer clamps `Saved` with `Math.Max(0, …)`. If the user lowered the balance manually after transferring, undo silently changes history instead of reporting the conflict. | Confirmed (code path) | P1 | `SavingsEndpoints.cs` `Mark()` |
| F4 | Two simultaneous "mark transferred" requests on an existing, un-transferred state both add to `Saved` (double count). New states are protected by the unique `(SavingsAccountId, Month)` index, but then the second request returns 500. No transaction/idempotency key. | Potential | P1 | `SavingsEndpoints.cs` `/transferred` endpoints |
| F5 | Over-allocation across rules (e.g. 70 % + 50 % of one salary) is detected and shown (`SourceStatus.Over`), but transfers can still be confirmed with no acknowledgement. Validation only checks each rule ≤ 100 %. | Confirmed (code path) | P1 | `SavingsPlan.Sources`, `SavingsEndpoints.Validate` |
| F6 | Source allocation is the only affordability check. Nothing warns when expenses + savings exceed total income except the negative hero number. | Confirmed (code path) | P1 | `GetMonthPlan`, `HeroCard.tsx` |
| F7 | A **fixed** rule pointing at a deleted income still allocates its full amount (percentage rules drop to 0). Shown as "Borttagen källa", but the money is counted as savings. | Confirmed (code path) | P2 | `SavingsPlan.PlannedTotal` |
| F8 | Fixed rules and entry amounts accept decimals while percentage results are whole kronor and the UI formats with 0 decimals. Rounding policy is implicit. | Confirmed (code path) | P2 | `SavingsPlan.AmountFor`, `lib/format.ts`, `lib/amount.ts` |
| F9 | Negative safe-to-spend is **not** clamped (good) and the hero card says "Över budget". | Verified correct | — | `BudgetCalculator`, `HeroCard.tsx:26` |

## 4. API and data integrity

| # | Finding | Status | Priority | Location |
|---|---|---|---|---|
| D1 | Updating an entry validates the category against the *request's* `Kind`, but `Entry.Kind` is never changed. An income can be given an expense-only category or `IsAutogiro = true`. | Confirmed (code path) | P2 | `EntryEndpoints.cs` PUT |
| D2 | Entry PUT/DELETE and savings DELETE do not check that the entry/account is live in the given month. `Repeats=false` on a month before `From` sets `To ≤ From`, hiding the entry everywhere. | Potential | P2 | `EntryEndpoints.cs`, `SavingsEndpoints.cs` |
| D3 | All personal-data endpoints filter by the JWT user id (`GetByIdAsync(id, userId)`, ownership subquery for month states). | Verified correct by reading; cross-user tests exist for entries/savings | — | repositories |
| D4 | Account deletion removes domain data (cascade) then the Identity user, in two separate saves without a transaction. | Confirmed (code path) | P2 | `ProfileEndpoints.cs` DELETE |
| D5 | No documented backup/restore procedure; Neon plan's retention unverified. | Confirmed | P1 | — |

## 5. Authentication and security

| # | Finding | Status | Priority | Location |
|---|---|---|---|---|
| S1 | Registration returns 409 "En användare med denna e-post finns redan." → account enumeration. | Confirmed | P1 | `AuthEndpoints.cs` register |
| S2 | Login returns immediately for unknown e-mail (no hash work) and returns 429 lockout only for existing accounts → enumeration by timing and by status. | Confirmed (code path) | P1 | `AuthEndpoints.cs` login |
| S3 | Changing password does not revoke refresh tokens; other sessions stay valid for up to 60 days. Account deletion and password change require no re-authentication beyond the current password for the change itself. | Confirmed (code path) | P1 | `ProfileEndpoints.cs` |
| S4 | No password reset, no e-mail verification, no Google/Apple sign-in. A user who forgets the password loses their data. | Confirmed | **P0** for public launch | — |
| S5 | Rate limiting partitions on `RemoteIpAddress` with `ForwardLimit = 1`. Traffic arrives via Vercel's rewrite, so the right-most forwarded address is likely Vercel's egress IP: all users could share one bucket (60 auth req/min). | Potential — needs a check against production headers | P1 | `Program.cs` |
| S6 | Production CORS includes a hard-coded preview deployment URL. | Confirmed | P2 | `Program.cs` |
| S7 | `/api/auth/demo` creates real accounts without authentication (rate limited per IP). Acceptable for a portfolio demo; a flooding risk on a free database tier. | Confirmed | P2 | `AuthEndpoints.cs` |
| S8 | Good: access token in memory only, refresh token hashed (SHA-256) and rotated with reuse detection, httpOnly/Secure cookie scoped to `/api/auth`, lockout after 5 attempts, dev JWT key refused outside Development, ProblemDetails in production, CSP/HSTS/nosniff on Vercel, CodeQL + NuGet/npm audits in CI. | Verified by reading | — | — |

## 6. Frontend, UX, accessibility, responsive

| # | Finding | Status | Priority | Location |
|---|---|---|---|---|
| U1 | Viewport disables zoom (`maximum-scale=1.0, user-scalable=no`) — WCAG 1.4.4 failure. | Confirmed | P1 | `frontend/index.html` |
| U2 | `keepPreviousData` on month and savings queries with no `isPlaceholderData` handling: after switching month, the previous month's figures are shown under the new month's title until the request finishes. | Confirmed (code path) | P1 | `useMonthPlanQuery.ts`, `useSavingsQuery.ts` |
| U3 | Below 1024 px the app is capped at 420 px wide; tablets show a phone-sized column. | Confirmed | P1 | `AppShell.tsx:75`, `useIsDesktop.ts` |
| U4 | `<html lang="en">` while all content is Swedish (screen readers use the wrong voice). | Confirmed | P1 | `frontend/index.html` |
| U5 | Playwright only runs one project (Pixel 7). No tablet, desktop, Firefox or WebKit coverage. | Confirmed | P1 | `playwright.config.ts` |
| U6 | ~120 arbitrary values (`[13px]`, raw hex) in TSX next to the `@theme` tokens. | Confirmed | P3 | `src/**/*.tsx` |
| U7 | Unused Vite template assets (`assets/react.svg`, `assets/vite.svg`, `App.css`). | Potential (check imports) | P3 | `frontend/src` |
| U8 | Single 555 kB JS chunk. | Confirmed | P3 | build output |
| U9 | No onboarding, no PWA manifest/service worker (README says PWA). | Confirmed | P2 | — |

## 7. Branding inventory (input to Phase 1)

- **User-facing:** `index.html` title, `Login.tsx`, `DesktopTopBar.tsx`, `Home.tsx`,
  `favicon.svg`, README, `DemoData` e-mail domain shown in the demo response.
- **Safe internal:** JWT `Issuer`/`Audience` strings (changing them logs everyone out once — leave),
  CSS class names, test names.
- **Persistent / infrastructure — do not rename:** C# namespaces and project names, `BudgexDbContext`
  and migration classes, database name, Cloud Run service `budgex-api`, Artifact Registry repo,
  Vercel project/domain `budgex-omega.vercel.app`, CORS origins.

## 8. Missing launch requirements

Password reset and e-mail verification (P0), privacy policy and data export (P1), backup
procedure (P1), a commercial-use-compliant Vercel plan before any commercial launch (P1),
trademark/domain checks for "Divunds" (owner, P1), tablet/desktop test coverage (P1).

## 9. Plan

One branch and one PR per phase, merged only on green CI:

1. **Phase 1 — Rebrand** (user-facing only; no namespace/database/infra renames).
2. **Phase 2 — Financial hardening**, starting with F1 (regression test first), then F3–F5, F2/F4
   with a concurrency token and a transaction, rounding policy ADR.
3. **Phase 3 — Auth** (enumeration fixes, session revocation, password reset + verification
   behind a replaceable e-mail sender; Google/Apple only once credentials exist).
4. Phases 4–11 as specified, each re-audited against this baseline.

Phase 2's F1 fix is the most urgent change in the repository; it can be moved ahead of the
rebrand if the owner prefers.

## 10. Resolution log

| Finding | Outcome | PR |
|---|---|---|
| F1 | Fixed: omitted `saved` leaves the balance unchanged | #76 |
| F2 | Fixed: the form sends `saved` only when the user changed it | #78 |
| F3 | Fixed: undo never clamps; it is refused with 409 when the balance no longer covers it | #78 |
| F4 | Fixed: transfers are transactional, conditional updates; parallel requests count once | #78 |
| F5, F6 | Fixed: transfers in an underfunded month need acknowledgement (ADR 0004) | #79 |
| F7 | By design: a fixed rule keeps its amount when its source is gone, so the month shows a shortfall and transfers need acknowledgement instead of the plan silently shrinking | this PR (test) |
| F8 | Fixed: rounding policy (ADR 0005), more than two decimals rejected | #80 |
| D1 | Fixed: an entry's kind cannot change through update | this PR |
| D2 | Fixed: update, delete and paid return 404 for a month the entry is not live in | this PR |
| D4 | Partly fixed: a failed Identity deletion now returns an error instead of 204. Domain data and Identity are still deleted in two steps, by design (see comment in `ProfileEndpoints`) | this PR |
| S2 | Fixed: unknown e-mail, wrong password and locked account all return the same 401, with equalised hashing time | this PR |
| S3 | Fixed: a password change revokes every refresh token; the client signs in again. New "Logga ut från alla enheter". Access tokens still live up to 15 minutes | this PR |
| S4 | Partly fixed: password reset implemented (ADR 0006), live once a mail provider is configured (`docs/email-setup.md`). E-mail verification and social sign-in remain | this PR |
