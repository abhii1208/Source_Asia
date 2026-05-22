# AeroMint - Flight Management Web App

## Overview
Responsive, production-like flight booking web app built for internship assignment requirements.  
The app supports flight search, seat selection, booking management, Supabase Auth, realtime seat updates, Zustand persistence, offline cache fallback, and PWA install.

## Tech Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Realtime
- Zustand persist
- next-pwa

## Features
- Flight search by route/date/passengers/class
- Supabase-first results with curated fallback flights when live data is unavailable
- Passenger form step
- Interactive seat map UI
- Supabase Realtime seat availability sync
- Booking confirmation with PNR
- My Bookings list and Booking Details view
- Reschedule booking via `reschedule_booking_atomic`
- Cancel booking via `cancel_booking_atomic`
- DB-level cancellation block for departures within 2 hours
- Offline fallback for My Bookings using cached Zustand data
- PWA manifest, service worker, and install prompt banner

## Supabase Setup
1. Create a Supabase project.
2. Open **SQL Editor** in Supabase.
3. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_rpc_functions.sql`
   - `supabase/migrations/004_seed_data.sql`
   - `supabase/migrations/005_debug_checks.sql`
   - `supabase/migrations/006_airline_and_popular_seed.sql`
4. Enable Realtime for `public.seats`:
   - Supabase Dashboard -> Database -> Replication -> toggle `seats`
   - or confirm `supabase_realtime` publication includes `public.seats`

## Environment Variables
Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

Notes:
- Client components must only use public keys.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be imported into client components.
- If using anon key only, set `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
  If using publishable key naming, set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Local Development
```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000/`
- `http://localhost:3000/search`
- `http://localhost:3000/my-bookings`

## Database Explanation
- `flights`: Route, timing, aircraft, status, and base fare.
- `seats`: Seat map per flight with class, availability, and extra fee.
- `bookings`: Booking master record tied to user, flight, and seat.
- `passengers`: Passenger records per booking.
- `reschedules`: Audit log for booking reschedule events.
- RLS policies:
  - Public read allowed for `flights` and `seats` (search availability).
  - User-scoped access for `bookings`, `passengers`, `reschedules`.
- RPC functions:
  - `reserve_seat_and_create_booking` (available for atomic create flow)
  - `cancel_booking_atomic`
  - `reschedule_booking_atomic`
- Trigger:
  - `trg_bookings_cancel_window` blocks cancellation within 2 hours of departure.
- Flight results fallback:
  - Live search tries Supabase first.
  - On no results or fetch error, curated upcoming flights are shown instead of a dead error state.

## Zustand Store Explanation
- `useFlightStore` stores:
  - active search query
  - selected flight
  - selected seat
  - current booking step
  - passenger form data
- `useUserStore` stores:
  - minimal safe session metadata
  - cached bookings
  - last sync timestamp
- Persist middleware:
  - enabled with `partialize`
  - sensitive fields excluded from local storage (`passport_no`, `passportNumber`)
- Reset behavior:
  - booking flow reset (`resetBookingFlow`, `resetAll`)
  - user store reset on logout (`resetUserStore`)

## PWA Explanation
- Manifest: `public/manifest.json`
- Icons:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
- Theme color: `#14B8A6`
- Display mode: `standalone`
- Offline fallback route: `/offline`
- Install prompt: `components/pwa/InstallPrompt.tsx`
- Cached bookings fallback:
  - My Bookings reads local cached bookings when offline / fetch fails

Lighthouse PWA screenshot placeholder: add screenshot in submission package.

## Supabase Management and Debugging

### 1) Confirm seed data exists
Run in SQL Editor:
```sql
select count(*) from public.flights;
select count(*) from public.seats;
```

### 2) Confirm policies exist
```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### 3) Confirm RPC functions exist
```sql
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
and proname in (
  'reserve_seat_and_create_booking',
  'cancel_booking_atomic',
  'reschedule_booking_atomic'
);
```

### 4) Create a test user
- Open Auth -> Users in Supabase Dashboard.
- Create user manually, or register from `/auth/register` in the app.

### 5) Debug flight loading errors
If `/flights` shows load error:
1. Verify `.env.local` keys are present.
2. Restart dev server after env changes.
3. Confirm `flights` and `seats` have public read policies.
4. Confirm seed flights exist for searched route/date.
5. Check server logs for Supabase error code/details (development mode logs enabled).

### 6) IPv4 direct DB connection issue
If direct DB connection fails in restricted IPv4 networks, use Supabase **Session Pooler** connection string in `DATABASE_URL`.

## Test Account (Placeholder)
- Email:
- Password:

## Screenshots Checklist
- Home
- Search
- Results
- Passenger form
- Seat map
- Confirmation
- My Bookings
- Lighthouse PWA score

## Known Limitations
- Payment processing is not implemented (not required by assignment).
- External real-world flight status API is optional and not required.
- Supabase seeded flights remain the source of truth for booking.

## Deployment (Vercel)
1. Push repository to GitHub.
2. Import repository in Vercel.
3. Configure environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional if publishable key already set)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `DATABASE_URL` (optional if used)
4. Build command: `npm run build`
5. Output: Next.js default
6. Deploy.
7. After deployment, verify:
   - Auth login/register
   - Flight search
   - Seat selection
   - My Bookings
   - Cancel/Reschedule
   - PWA manifest + service worker

Production URL placeholder: `<add-vercel-url-here>`

## Final Verification Commands
```bash
npm run lint
npm run build
```

## Submission Checklist
- [ ] Supabase project configured
- [ ] Migrations run in order
- [ ] Realtime enabled for `seats`
- [ ] `.env.local` ignored
- [ ] `.env.example` committed
- [ ] No secrets committed
- [ ] Lint passes
- [ ] Build passes
- [ ] Booking flow tested
- [ ] My Bookings offline fallback tested
- [ ] PWA install tested
- [ ] Screenshots captured
