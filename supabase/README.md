# ResQNova Supabase Foundation

This directory contains the database foundation for the ResQNova portals.

## Configuration

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

The frontend clients read these values at runtime. Credentials are never stored in source files.

## Apply the schema

From the repository root, authenticate and link the Supabase CLI to the project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migrations create the ResQNova tables, relationships, indexes, RLS policies, role helpers, the read-only `dashboard_metrics` aggregate, and the multi-role workflow tables used by the command center and portals.

The latest workflow migration adds `citizen_profiles`, `citizen_requests`, `rescue_missions`, and `notifications`. Authenticated users select a role during signup; the auth trigger creates their shared `public.users` profile. The authority dashboard reads citizen requests and rescue missions through Supabase Realtime.

## Load demo data

Run the seed after the migration from the repository root:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Alternatively, paste `seed.sql` into the Supabase SQL Editor after the migration has been applied. The seed contains Vijayawada-focused demo records and intentionally leaves `auth_id` values null until real Supabase Auth users are created.

## Local development

For a local Supabase stack, start the services and reset the database with the migration and seed configured in the CLI project:

```bash
npx supabase start
npx supabase db reset
```

The dashboard metric view is read-only and exposes aggregate counts only. Row-level operational data remains protected by the table policies.
