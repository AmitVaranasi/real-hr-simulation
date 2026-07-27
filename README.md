# Real HR Simulation

Web-based HR business simulation for higher education — built from `DESIGN_DOCUMENT.md`.

Teams make HR decisions across **7 modules** each round. The simulation engine computes HR metrics, financial outcomes, and **Balanced Scorecard (BSC)** scores (100 points per round).

## Quick start

```bash
cd "HR Simulation"
npm install
cp .env.example .env.local   # add Supabase keys
npm run dev
```

- **Without Supabase:** http://localhost:3000/simulate (offline practice mode)
- **With Supabase:** Register → configure database → run full class simulation

## Supabase setup (required for classes)

1. Create a project at [supabase.com](https://supabase.com)
2. Fill `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # required for round compute
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Run in SQL Editor (in order):
   - `supabase/schema.sql`
   - `supabase/rls.sql`
   - `supabase/migration-v2.sql`
   - `supabase/migration-v3.sql`
   - `supabase/migration-v4.sql`
   - `supabase/migration-v5-admin.sql` (admin role + config/session read policies)
   - `supabase/migration-v6-full-admin.sql` (audit log, config revisions, disable flags, formula notes)
   - `supabase/migration-v7-student-leave-team.sql` (students can leave/switch teams)
4. Enable **Email** auth in Supabase → Authentication
5. Add `{APP_URL}/auth/callback` to Auth redirect URLs (password reset)
6. Optional: set `ADMIN_EMAILS=you@school.edu` in `.env.local` to bootstrap admins
   (or `UPDATE profiles SET role='admin' WHERE id='…'` in SQL)

## User flows

### Instructor
1. Register as **Instructor** → `/sessions`
2. **New session** → add teams (share **join codes**)
3. **Open round** → set economy (Boom / Normal / Recession)
4. **Close round** → auto-computes all team outcomes
5. **Release leaderboard** → `/sessions/[id]/leaderboard`
6. **Reports** → comparison, participation, PDF/Excel export, score overrides

### Student
1. Register as **Student** → `/join/[code]`
2. **Dashboard** → make decisions when round is open
3. **Review & submit** → `/round/[id]/review`
4. **Results** → BSC, metrics, feedback, reflection (after round closes)
5. **Leaderboard** → when instructor releases it
6. **History** → trends across rounds

### Admin
1. Bootstrap via `ADMIN_EMAILS` or SQL `role='admin'` → `/admin`
2. **User Management** → roles, disable/enable, password reset, impersonate
3. **Formula Repository** → document engine formulas; tune params in Configuration
4. **Version Management** → snapshot / restore global simulation config
5. **Audit Log** → administrator activity trail
6. **System** → Simulation Config + Testing Center

## Feature checklist

| Feature | Status |
|---------|--------|
| Simulation engine (14 metrics, financials, BSC) | ✅ |
| 7-module decision UI + budget tracker | ✅ |
| Offline simulator (`/simulate`) | ✅ |
| Auth (login, register, middleware) | ✅ |
| Admin portal (users, formulas, versions, audit) | ✅ |
| Sessions, teams, rounds | ✅ |
| Auto-save & submit decisions | ✅ |
| Round close → compute outcomes | ✅ |
| Results (BSC, metrics, feedback, trends) | ✅ |
| Team reflections (100–2000 chars) | ✅ |
| Leaderboard (instructor release) | ✅ |
| Instructor reports & participation | ✅ |
| Score override with reason | ✅ |
| PDF team report | ✅ |
| Excel class export | ✅ |
| Review page before submit | ✅ |
| Round history & trend charts | ✅ |

## Project structure

```
src/
  app/              # Pages & API routes
  components/       # UI (decisions, results, instructor, auth)
  lib/
    engine/         # Pure simulation engine
    export/         # PDF & Excel generators
    supabase/       # Clients
supabase/
  schema.sql        # Tables
  rls.sql           # Row-level security
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Design reference

- `../DESIGN_DOCUMENT.md` — full specification
- `../Real_HR_Simulation_V1_Specification.md` — formulas & benchmarks
