# ResQNova Project Outline

## 1. Product Vision

- AI-assisted emergency command center for Vijayawada.
- Digital twin focused on NTR District.
- Future scope for resource planning, evacuation, AI dispatch, and quantum optimization.

## 2. Frontend Foundation

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui-compatible component structure.
- Lucide React icons.
- Framer Motion animations.
- ResQNova futuristic command-center design system.
- Responsive desktop, tablet, and mobile layouts.

## 3. Shared UI System

- App shell with sidebar and top navigation.
- Glass cards.
- Metric cards.
- Status badges.
- Neon buttons.
- Alert banners.
- Loading indicators.
- Shared map controls and portal layouts.

## 4. Main Command Center

- Dashboard overview for Vijayawada operations.
- Live preparedness metrics.
- High-risk zones.
- Ready ambulances.
- Ready rescue teams.
- Available shelter capacity.
- Intelligence and operations panels.
- Resource planner.
- Evacuation planner.

## 5. Interactive Map

- Leaflet map engine.
- Thunderforest Atlas basemap.
- Open GIS-style zoom, pan, and fullscreen behavior.
- Vijayawada operational focus.
- Andhra Pradesh context.
- Supabase-powered operational layers.
- Tactical markers for:
  - Ambulances.
  - Rescue teams.
  - Hospitals.
  - Shelters.
- Flood-risk GeoJSON overlays.
- Road status layers.
- Deployment zones.
- Collapsible layer drawer.
- Clickable markers and glass-style detail popups.
- Map data refresh and realtime update foundation.

## 6. Operational Data

- Vijayawada-specific ambulance dataset.
- Vijayawada-specific rescue-team dataset.
- Hospital dataset.
- Shelter dataset.
- Road network dataset.
- Flood-risk zones.
- Deployment zones.
- Route graph foundation.
- NTR operational locations and staging areas.

## 7. Supabase Backend

- Browser and server Supabase clients.
- Authentication foundation.
- Role support for:
  - Admin.
  - Citizen.
  - Rescue.
  - Ambulance.
  - Shelter.
  - Hospital.
- PostgreSQL migrations.
- Seed data.
- Row-level security foundation.
- Public map data query support.
- Realtime subscriptions for operational tables.
- Request and mission lifecycle support.

## 8. Portal Structure

- Citizen portal.
- Rescue portal.
- Ambulance portal.
- Hospital portal foundation.
- Shelter portal foundation.
- Shared authentication and role-based routing.
- Shared Supabase data access.
- Shared operational map integration.

## 9. Live Synchronization

- Dashboard metrics read from Supabase.
- Map resources read from Supabase.
- Portal operations use shared data structures.
- Realtime update foundation for incidents, requests, resources, and missions.
- Operational status changes can be reflected across connected views.

## 10. AI Foundation

- Gemini-powered server-side AI dispatch workflow.
- Deterministic Vijayawada risk baseline with Gemini refinement.
- Risk, confidence, priority, reason, and recommendation persistence.
- Availability, distance, road-risk, and ETA-aware resource ranking.
- Rescue, ambulance, hospital, and shelter assignment workflow.
- Durable rescue missions and request assignments.
- Supabase notifications for citizens and responders.
- AI execution diagnostics and step-by-step status tracking.
- Dashboard-side processing for SOS requests created on another device.

## 11. Future Optimization Foundation

- FastAPI Quantum Engine bridge.
- Supabase-to-quantum live scenario adapter.
- Preserved upstream QAOA, QUBO, COBYLA, and statevector modules.
- Quantum endpoints for pre-positioning, rescue, ambulance, evacuation, and re-optimization.
- Route graph types.
- Road travel-time data.
- Road risk data.
- Safe-route rendering preparation.
- Resource deployment preparation.
- Future GraphHopper or OSRM integration point.

## 12. Database Migration Groups

- Initial ResQNova schema.
- Public map data access.
- UC-077 preparedness fields.
- Vijayawada digital-twin data.
- Clean Vijayawada operational dataset.
- Vijayawada map focus.
- Vijayawada live scope.
- Multi-role portals.
- Authentication profile fixes.
- AI dispatch workflow.
- Live portal synchronization.
- Request lifecycle.
- Portal status updates.
- Road network expansion.
- Rescue-team expansion.

## 13. Deployment Foundation

- Next.js production build configuration.
- Render deployment preparation.
- Environment-variable-based credentials.
- Supabase URL and anon key configuration.
- Thunderforest API key configuration.
- Gemini API key configuration.
- Supabase service-role key configuration for server operations.

## 14. Current Operational Focus

- Primary city: Vijayawada.
- Primary data scope: Vijayawada operational area.
- Main resources: ambulances, rescue teams, hospitals, shelters, roads, and risk zones.
- Mylavaram and wider Andhra Pradesh are secondary context only.

## 15. Main Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_THUNDERFOREST_API_KEY`
- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 16. Current Status

- Core dashboard and portal structure exists.
- Supabase migrations and Vijayawada operational data are prepared.
- Live map resource layers are connected to Supabase.
- Rescue-team locations are available on the map.
- Citizen SOS requests synchronize through Supabase Realtime.
- Dashboard live SOS queue shows priority and assignment status.
- AI diagnostics page is available at `/admin/ai-diagnostics`.
- AI execution migrations `20260910000017` and `20260910000018` are applied remotely.
- The project is pushed to the GitHub `main` branch.
- Gemini requires `GEMINI_API_KEY` on the server; a deterministic fallback remains available when it is absent.
- Quantum Engine bridge is available under `backend/` and requires `QUANTUM_ENGINE_URL` in the Next.js server environment.
- Further work remains for production validation, richer route-network ETA calculation, Supabase write-back of quantum plans, and final quantum optimization quality.
