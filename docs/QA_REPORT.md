# QA Report - FlyAhead

## Test Meta
- Date: May 22, 2026
- App: FlyAhead Flight Management Web App
- Environment: Local Windows dev machine, Next.js 14.2.x App Router, TypeScript, Tailwind, Supabase client/server integration
- Validation methods: Code-level QA audit, route/API contract review, lint/build verification, targeted auth/booking/realtime hardening

## Scope
- Auth/session UX and route protection
- Flight search validation and fallback behavior
- Passenger/seat/booking confirmation flow
- Confirmation, print ticket, email status path
- My Bookings, cancel/reschedule wiring
- PWA/offline and security hygiene checks

## Findings Summary
| ID | Area | Severity | Finding | Fix Status | Retest |
|---|---|---|---|---|---|
| QA-001 | Auth UI | High | Logged-in users could still see `Login`-path navigation in header/mobile state windows and static UI surfaces. | Fixed | Passed |
| QA-002 | Auth routes | High | Logged-in users could access `/auth/login` or `/auth/register` without enforced redirect. | Fixed | Passed |
| QA-003 | Login page build safety | High | `useSearchParams()` on login page caused App Router prerender failure without `Suspense`. | Fixed | Passed |
| QA-004 | Seat realtime | High | Selected seat was not cleared if it became unavailable after realtime updates. | Fixed | Passed |
| QA-005 | Search validation | Medium | Past departure/return dates were accepted in search forms. | Fixed | Passed |
| QA-006 | Search UX | Medium | Return date earlier than departure date was not blocked. | Fixed | Passed |
| QA-007 | Auth logout freshness | Medium | UI state could remain stale after logout without refresh trigger. | Fixed | Passed |
| QA-008 | Booking robustness | Medium | Race-condition seat conflict handling existed but seat selection recovery could be clearer on realtime changes. | Fixed | Passed |
| QA-009 | Security hygiene | Low | Required check for leaked secrets/client exposure and passport persistence hardening. | Verified safe | Passed |

## Detailed Results By Flow

### A) Auth
- Register valid/invalid and login wrong-password handling: validated by route/client logic and friendly error mapping.
- Refresh after login + header/mobile auth display: hardened via session read + `onAuthStateChange`.
- Logged-in access to `/auth/login` and `/auth/register`: now redirected by middleware and client guards.
- Logout behavior: now signs out, clears stores, refreshes router, and navigates to `/auth/login`.

Status: Passed (code + build validated).

### B) Flight Search
- Same origin/destination blocked.
- Missing date blocked.
- Past departure/return blocked.
- Return before departure blocked.
- Supabase fallback path remains intact via existing flight-service fallback.

Status: Passed.

### C) Flight Results
- Existing filter/sort/select/view seats flow preserved (no regressions introduced in this pass).

Status: Passed by regression review.

### D) Passenger Form
- Required: full name, nationality, DOB.
- Passport optional and no longer blocker.
- Future DOB rejected.
- Persist middleware still excludes passport from local storage.

Status: Passed.

### E) Seat Selection
- Occupied seat disable behavior preserved.
- Realtime refresh now clears stale selected seat when seat becomes unavailable.
- Duplicate submission prevention remains in place (`bookingSubmitting`).

Status: Passed.

### F) Booking Creation + Confirmation
- API route schema, friendly errors, RPC usage, PNR generation, confirmation redirect and email status forwarding are intact.
- Confirmation page, print button, and email notice states are intact.

Status: Passed.

### G) My Bookings
- Ticket print button exists in cards and details view.
- Email sent note supported from store status.
- Cancel/reschedule flows remain wired.

Status: Passed by regression review.

### H) PWA / Offline
- Manifest and offline page present.
- Install prompt state handling remains stable.
- Offline cached booking fallback retained.

Status: Passed.

### I) Security
- No service-role/database URL exposure in client components found.
- Server-only email sending preserved.
- Passport excluded from persisted flight store.
- Raw DB errors are mapped to user-friendly API responses in booking create route.

Status: Passed.

## Commands Run
- `npm run lint` -> Passed
- `npm run build` -> Passed

## Residual Risk Notes
- Full end-to-end UI interaction with live Supabase project credentials should still be run once in staging for final sign-off (auth provider behavior, realtime network timing, email deliverability).