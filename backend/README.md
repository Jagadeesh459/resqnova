# ResQNova Quantum Engine

## Run locally

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python -m backend.main
```

The service runs on `http://localhost:8000`.

## Environment

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
```

The service reads live Vijayawada rows from Supabase and never accepts the
service-role key from the browser.

## Endpoints

- `GET /health`
- `GET /api/quantum/status`
- `POST /api/quantum/preposition`
- `POST /api/quantum/rescue`
- `POST /api/quantum/ambulance`
- `POST /api/quantum/evacuation`
- `POST /api/quantum/reoptimize`
- `POST /api/quantum/benchmark`

The Next.js server proxies dashboard re-optimization through:

```env
QUANTUM_ENGINE_URL=http://localhost:8000
```

The upstream QAOA modules are preserved under the root `optimization/` package.
The adapter limits live candidates for statevector simulation and maps them to
the upstream scenario contract.
