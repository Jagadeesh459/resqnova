# ResQNova

ResQNova is a Vijayawada-focused emergency command platform for UC-077 disaster-management resource and evacuation planning.

## Current Product

- Authority Command Center at `/dashboard`
- Separate Citizen portal at `/citizen`
- Separate Rescue portal at `/rescue`
- Separate Ambulance portal at `/ambulance`
- Supabase Auth, PostgreSQL, RLS, and Realtime
- Thunderforest Atlas and Leaflet tactical map
- Live Vijayawada resource layers and citizen SOS monitoring
- Resource Planner and Evacuation Planner foundations

The Citizen, Rescue, and Ambulance interfaces are separate role experiences. They are not rendered inside the Authority Dashboard.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- A Thunderforest API key for the Atlas basemap

## Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_THUNDERFOREST_API_KEY=YOUR_THUNDERFOREST_API_KEY
NEXT_PUBLIC_OSRM_URL=https://router.project-osrm.org
```

Never commit `.env.local` or service-role credentials.

## Local Development

From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000/login`.

Useful validation commands:

```bash
cd frontend
npx tsc --noEmit
npm run build
npm run start
```

## Supabase Setup

From the repository root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

For intentional demo data loading:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Supabase migrations create the operational schema, Vijayawada dataset, authentication trigger, role policies, citizen requests, rescue missions, notifications, and Realtime publication entries. See [supabase/README.md](supabase/README.md).

## Authentication

1. Open `/login`.
2. Choose `Create Account`.
3. Select a role and register with a real email.
4. Confirm the email if Supabase email confirmation is enabled.
5. Sign in again.

Roles currently supported by the login form are `admin`, `citizen`, `rescue`, `ambulance`, `shelter`, and `hospital`. Admin signup is intended for development/demo setup; restrict it before production.

Seed emails in `supabase/seed.sql` are profile records only and do not have passwords.

## Deploy To Render

The repository includes [`render.yaml`](render.yaml) for a Node web service.

### Blueprint deployment

1. Push the repository to GitHub.
2. In Render, select **New → Blueprint**.
3. Choose the ResQNova GitHub repository.
4. Render detects `render.yaml`.
5. Create the service.
6. Add values for the three `sync: false` variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_THUNDERFOREST_API_KEY`
7. Deploy.

Render uses:

```text
Root directory: frontend
Build command: npm ci && npm run build
Start command: npm run start
Health check: /login
```

### Manual Render setup

If you do not use the Blueprint, create a **Web Service** with:

```text
Repository: your ResQNova GitHub repository
Root Directory: frontend
Runtime: Node
Build Command: npm ci && npm run build
Start Command: npm run start
```

Add the same environment variables in Render. Do not add `.env.local` to GitHub.

After deployment, verify:

- `/login` loads.
- `/dashboard` redirects unauthenticated users to `/login`.
- Thunderforest tiles load.
- Supabase metrics and map layers load.
- Citizen SOS requests appear in the authority map and request feed.

## Backend Status

The `backend/` directory is an empty FastAPI-ready structure. It is intentionally not deployed as a Render service until API logic and a dependency contract are added.

## Documentation

- [Master project documentation](MASTER_PROJECT_DOCUMENTATION.md)
- [Supabase setup](supabase/README.md)
- [Map data notes](docs/map-data.md)
