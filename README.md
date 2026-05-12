# PDP Certificate Lookup & Bulk Generator

Hệ thống tra cứu và sinh chứng nhận điện tử cho Phòng Phát triển Sinh viên (PDP) — FPT Polytechnic TP.HCM.

This is a long-term, free-tier-friendly web app that lets PDP staff bulk-generate certificate PNGs from an Excel roster + a Canva-exported template, store them on Google Drive, and let students look up their certificate by student code (MSSV).

> **Status:** Milestone 1 + 2 (project scaffold + database schema). The public lookup form, verification page, and admin shell render. Bulk generator and Drive upload come in M6–M10.

---

## Stack

- **Next.js 16** (App Router, Server Components, `proxy.ts` formerly Middleware)
- **React 19**, **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Supabase** (Postgres + Auth + RLS) — schema in [`supabase/migrations/`](./supabase/migrations)
- **Google Drive** for final PNG storage (Mode 1 manual upload at MVP, Mode 2 OAuth later)
- **pnpm** + **Vercel** for deployment

---

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Provision Supabase

Create a free Supabase project (region `ap-southeast-1` — Singapore — for lowest HCMC latency) at <https://supabase.com>.

Then in **Dashboard → SQL Editor**, paste and run, **in this order**:

1. [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) — schema, indexes, `updated_at` triggers, `handle_new_user` trigger
2. [`supabase/migrations/0002_rls.sql`](./supabase/migrations/0002_rls.sql) — RLS policies and the `is_admin()` helper
3. [`supabase/migrations/0003_rpc_public_lookup.sql`](./supabase/migrations/0003_rpc_public_lookup.sql) — the two `SECURITY DEFINER` RPCs that the public uses
4. _(Optional)_ [`supabase/seed.sql`](./supabase/seed.sql) — one demo campaign + 2 demo certificates so the lookup form has something to test against

After running, go to **Database → Advisors → Security** and confirm zero warnings (RLS enabled on every table in `public`).

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable                               | Where to find it                                             |
| -------------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Dashboard → Project Settings → API → Project URL             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page → Publishable key (or legacy anon key — both work) |
| `SUPABASE_SERVICE_ROLE_KEY`            | Same page → Service role secret (server only, never commit)  |
| `NEXT_PUBLIC_SITE_URL`                 | Public origin, e.g. `https://tracuuchungnhan-pdp.edu.vn`     |

### 4. Create your first admin

There is no signup UI in M1 — admin accounts are created in two steps:

1. In **Supabase Dashboard → Authentication → Users**, click **Add user → Create new user**, set an email and a temporary password.
2. In the SQL Editor, promote that user:

   ```sql
   update public.profiles
   set role = 'super_admin'
   where id = '<paste auth.users.id from the previous step>';
   ```

A trigger in `0001_init.sql` automatically creates a `profiles` row with role `viewer` whenever a Supabase Auth user signs up — the SQL above just bumps that row to `super_admin`.

### 5. Run

```bash
pnpm dev
```

Open <http://localhost:3000> for the public lookup, and <http://localhost:3000/admin> for the (gated) admin shell.

---

## Scripts

| Command             | What it does                |
| ------------------- | --------------------------- |
| `pnpm dev`          | Start the dev server        |
| `pnpm build`        | Production build            |
| `pnpm lint`         | ESLint                      |
| `pnpm typecheck`    | `tsc --noEmit`              |
| `pnpm format`       | Prettier write              |
| `pnpm format:check` | Prettier check (used in CI) |

---

## Project layout

```
app/
  (public)/             public site (lookup + verify)
  (auth)/login/         admin sign-in (M4)
  admin/                gated admin dashboard
  api/
    lookup/             POST — calls public_lookup_certificate RPC
    verify/[code]/      GET  — calls public_verify_certificate RPC
    health/             liveness probe
components/
  ui/                   shadcn/ui primitives
  public/               header, footer, lookup form
lib/
  supabase/             client / server / proxy / service-role helpers
  auth/                 requireAdmin server guard
  utils/                normalize.ts, filename.ts (diacritic-aware)
  validation/           Zod schemas (e.g. /^PS\d{5,}$/)
proxy.ts                Next.js 16 proxy — refreshes session, gates /admin
supabase/
  migrations/           0001 → 0002 → 0003
  seed.sql              optional demo data
types/
  database.ts           hand-written DB types (replace with `gen types`)
  certificate.ts        domain types
```

---

## Architectural notes

- **Public users never read `certificates` directly.** All public reads go through the `SECURITY DEFINER` RPCs `public_lookup_certificate` and `public_verify_certificate`, which only return:
  - rows where `certificate.status = 'published'` AND `campaign.status = 'published'`
  - a small set of fields (no email, no DOB, no metadata)

  This makes mass enumeration of PSxxxxx codes impossible — there is no listing query the anon key can run.

- **`@supabase/ssr` with Next.js 16:** uses `proxy.ts` (formerly `middleware.ts`) and `supabase.auth.getClaims()` — never `getSession()` server-side. See [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- **Bulk certificate generation** (M7) runs in the browser via Canvas + Web Worker so PDP staff can produce 1000+ PNGs without server costs or timeouts.
- **Vietnamese diacritics** are kept on the certificate but stripped for filenames: `Nguyễn Văn A → NGUYEN_VAN_A`. See [`lib/utils/normalize.ts`](./lib/utils/normalize.ts).

---

## Deployment

Push to `main` → Vercel builds and deploys. Set the env vars (same names as `.env.example`) in Vercel → Project Settings → Environment Variables. Add your domain (`tracuuchungnhan-pdp.edu.vn`) under **Domains**.

---

## Roadmap

- [x] **M1** Project setup
- [x] **M2** Database schema + RLS + public-lookup RPCs (SQL files only — apply manually)
- [ ] **M3** Wire homepage + lookup result page to live data
- [ ] **M4** Admin auth & gated dashboard
- [ ] **M5** Campaign management
- [ ] **M6** Excel import wizard
- [ ] **M7** Browser-side bulk certificate generator (Canvas + Web Worker, fit-text, QR)
- [ ] **M8** Save certificate metadata to Supabase + publish
- [ ] **M9** Google Drive — Mode 1 (manual upload + manifest matcher)
- [ ] **M10** Google Drive — Mode 2 (direct OAuth upload)
