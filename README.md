# ResQNova 🌊🚨
### AI-Assisted Disaster Preparedness, Resource Pre-Positioning & Risk-Aware Evacuation

**Preparing before disaster strikes. Optimizing every decision that follows.**

ResQNova is an AI-assisted disaster preparedness and evacuation planning platform designed to help emergency management teams prepare for floods and other severe-weather emergencies. By combining geospatial visualization, graph-based routing, risk assessment, resource allocation, and experimental quantum optimization, ResQNova aims to support faster, safer, and more informed disaster-response decisions.

The platform focuses on **Vijayawada, Andhra Pradesh, India**, with an emphasis on proactive preparedness rather than relying exclusively on post-disaster response.

> **Problem Statement:** UC-077 — Disaster Resource Pre-Positioning and Evacuation Optimization.

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Routing and Optimization](#-routing-and-optimization)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Application Modules](#-application-modules)
- [Disaster Simulation Workflow](#-disaster-simulation-workflow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Data and Reliability](#-data-and-reliability)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)

## 🌍 The Problem

During floods and severe-weather emergencies, emergency management teams may face several challenges:

- Emergency resources may not be positioned close enough to high-risk areas.
- Road closures and flooding can make previously viable routes unusable.
- Evacuation demand may exceed the available capacity of nearby shelters.
- Resource allocation and evacuation planning can be difficult to coordinate across multiple agencies.
- Decisions made without comparing alternative scenarios may increase response time and risk.

Traditional reactive approaches are not always sufficient. Disaster preparedness requires anticipating potential emergencies, identifying vulnerable areas, positioning resources strategically, and preparing alternative evacuation plans before conditions deteriorate.

## 💡 Our Solution

ResQNova brings these planning activities together in a unified, map-based decision-support platform.

It aims to help emergency management teams:

1. Visualize operational resources, roads, shelters, hospitals, and disaster-risk zones.
2. Assess potential disaster scenarios and estimate emergency demand.
3. Determine suitable locations for pre-positioning ambulances and rescue teams.
4. Generate risk-aware routes and evacuation assignments.
5. Recalculate routes when road conditions change.
6. Compare classical optimization approaches with experimental quantum optimization.
7. Review and approve proposed plans before operational execution.

The system is designed to support human decision-makers, not replace emergency authorities.

## 🚀 Key Features

### 🗺️ Interactive Geospatial Command Center

- Interactive map built with Leaflet.
- Road-network and location visualization.
- Operational layers for ambulances, rescue teams, hospitals, shelters, flood-risk zones, and deployment areas.
- Route visualization and road-condition indicators.
- Resource details and operational status in map popups or panels.
- Vijayawada-focused operational planning.

### 🌧️ Scenario-Based Disaster Risk Assessment

- Simulated heavy-rainfall and flood scenarios.
- Risk-zone visualization.
- Configurable risk scoring and estimated emergency demand.
- Identification of areas that may require additional resources.
- Support for comparing preparedness scenarios.

### 🚑 Intelligent Resource Pre-Positioning

- Evaluate available ambulances and rescue teams.
- Identify suitable staging locations.
- Estimate travel costs between resources and demand zones.
- Compare existing deployment with proposed deployment.
- Account for resource availability, risk, and coverage constraints.

### 🧭 Graph-Based Routing and Dynamic Rerouting

ResQNova's routing design uses a weighted road graph to represent road intersections and connecting road segments.

- **A\* Search:** Finds a suitable path between a source and destination using accumulated cost and a heuristic.
- **D\* Lite:** Supports incremental replanning when road conditions or traversal costs change.
- **Risk-aware routing:** Incorporates configurable travel-time, distance, flood-risk, and road-availability costs.
- **Alternative routes:** Helps evaluate other feasible paths when the preferred route becomes unavailable.
- **Real-road visualization:** Routes should follow road geometry rather than straight lines between locations.

A routing engine such as OSRM can provide routes over a real road network, while custom graph algorithms and risk-aware costs can support the project's specialized planning requirements.

### 🏠 Evacuation and Shelter Planning

- Estimate evacuation demand across affected zones.
- Match demand with suitable shelters.
- Respect shelter capacity constraints.
- Evaluate route distance, travel time, risk, and road availability.
- Compare alternative evacuation plans.
- Reassess affected assignments when conditions change.

### 🧠 AI-Assisted Decision Support

- Configurable disaster-risk scoring.
- Estimated demand and resource requirements.
- Data-driven recommendations when suitable data is available.
- Explainable planning metrics to help operators understand recommendations.

The initial approach can use transparent rules and scoring before introducing machine-learning models that require suitable training data and evaluation.

### ⚛️ Experimental Quantum Optimization

ResQNova explores quantum optimization for selected resource-allocation and evacuation-planning problems.

- Quadratic Unconstrained Binary Optimization (QUBO) formulations.
- Quantum Approximate Optimization Algorithm (QAOA) experiments.
- Qiskit-based experimentation.
- Comparison against classical optimization baselines.
- Evaluation using solution quality, runtime, constraint violations, and scalability.

Quantum optimization is an experimental component. Its inclusion does not imply demonstrated quantum advantage; results must be established through benchmarking.

### 🔄 Live Operational Data and Coordination

The platform is designed to use Supabase for structured operational data and, where configured, realtime updates.

- Resource status and availability.
- Shelter occupancy and capacity.
- Hospital and rescue-team information.
- Road-condition and risk updates.
- Planning results and proposed assignments.

Live updates depend on database configuration, data availability, and the implementation of the relevant integrations.

---

## 🧮 Routing and Optimization

ResQNova separates pathfinding, dynamic replanning, and resource optimization because they solve different problems.

| Component | Responsibility |
|---|---|
| Weighted road graph | Represents intersections, road segments, and traversal costs |
| A* Search | Finds a path between two locations |
| D* Lite | Reuses previous search information to support replanning after graph changes |
| OSRM / routing engine | Provides routes over a real road network |
| Risk assessment | Estimates hazard levels and associated costs |
| Classical optimizer | Establishes a baseline for resource and evacuation decisions |
| QUBO / QAOA experiments | Explore quantum approaches to selected optimization problems |

### Example: Dynamic Route Replanning

1. An ambulance receives a destination and an initial route.
2. A road on that route becomes blocked in a simulated flood scenario.
3. The system updates the affected road's availability or cost.
4. D* Lite can recalculate the route using incremental search.
5. The revised route is displayed for operator review.

### Example: Resource Pre-Positioning

1. Identify risk zones and estimated demand.
2. Calculate travel costs from candidate staging locations.
3. Evaluate resource availability and coverage.
4. Generate a proposed deployment.
5. Compare the proposal with the baseline and review the result.

---

## 🏗️ System Architecture

The intended architecture separates the user interface, operational data, routing, and optimization responsibilities.

```text
                    ResQNova Platform
                           |
             +-------------+-------------+
             |                           |
        Next.js Frontend             User Portals
             |                           |
        Leaflet Maps              Command Center
             |                    Resource Planner
             |                    Evacuation Planner
             |                    Citizen / Responder
             |
       Supabase Services
       - PostgreSQL
       - Authentication
       - Realtime
             |
       Planning and Backend Services
             |
       +-----+----------+----------------+
       |                |                |
  Risk Assessment   Road Routing    Optimization
       |             A* / D* Lite    Classical Solver
       |             OSRM            QUBO / QAOA
       +----------------+----------------+
                        |
                 Planning Results
                        |
                Operator Review
```

The diagram represents the intended logical architecture; the implementation status of each integration should be verified in the repository.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Mapping | Leaflet, React Leaflet |
| Basemap | Thunderforest Atlas |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Realtime updates | Supabase Realtime |
| Backend / API | Python, FastAPI — planned or used where implemented |
| Road routing | OSRM or a compatible routing engine |
| Pathfinding | A* and D* Lite |
| Quantum experimentation | Python, Qiskit, QUBO, QAOA |
| Version control | Git and GitHub |

## 🧩 Application Modules

### 1. Command Center

Central dashboard for monitoring preparedness metrics, viewing operational map layers, inspecting risk scenarios, and reviewing planning results.

### 2. Resource Planner

Supports resource availability review, staging-location selection, coverage analysis, and deployment recommendations.

### 3. Evacuation Planner

Supports demand-zone analysis, shelter allocation, route evaluation, capacity checks, and comparison of evacuation alternatives.

### 4. Citizen Portal

Designed to present relevant emergency alerts, shelter information, evacuation guidance, and assistance-request features.

### 5. Ambulance Portal

Designed to show ambulance availability, assignments, destinations, and route information.

### 6. Rescue Team Portal

Designed to support rescue-team readiness, personnel and equipment information, sector assignments, and missions.

### 7. Hospital Portal

Designed to represent emergency capacity, available beds, and expected incoming cases.

### 8. Shelter Portal

Designed to track shelter capacity, occupancy, readiness, and essential supplies.

The portal descriptions represent intended capabilities; features should be marked complete only after they have been implemented and tested.

## 🔬 Disaster Simulation Workflow

A representative demonstration can follow this sequence:

1. **Select a scenario:** Configure a simulated heavy-rainfall or flood event around Vijayawada.
2. **Assess risk:** Display risk zones and estimated emergency demand.
3. **Plan resources:** Generate and compare ambulance and rescue-team deployment proposals.
4. **Plan evacuation:** Assign demand to suitable shelters and calculate feasible routes.
5. **Inspect the map:** Review roads, resource locations, risk zones, and route alternatives.
6. **Simulate disruption:** Block a road or increase its flood-risk cost.
7. **Replan:** Demonstrate dynamic routing and re-evaluate affected evacuation or deployment decisions.
8. **Review and approve:** Let the operator inspect the proposed changes before treating them as operational decisions.

## ⚙️ Getting Started

### Prerequisites

Install the following tools before running the project:

- Node.js and npm.
- Git.
- A Supabase project.
- A Thunderforest API key for the configured basemap.
- Python, if the backend and optimization services are being used.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd resqnova
```

Replace the placeholder with the actual URL of your GitHub repository.

### 2. Configure the frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory and configure the environment variables described below.

### 3. Configure Supabase

- Create or select your Supabase project.
- Apply the database migrations in the repository.
- Load the provided seed data if the project includes it.
- Configure the required authentication and Row Level Security policies.
- Enable Realtime for the relevant tables if realtime updates are implemented.

Use simulated demonstration data only where clearly identified as such.

### 4. Run the frontend

```bash
npm run dev
```

Open the local development URL printed by Next.js, typically `http://localhost:3000`.

### 5. Backend and optimization services

If the repository contains a FastAPI backend or separate optimization service, follow the instructions in the corresponding backend documentation. Do not assume these services are running simply because the frontend starts successfully.

## 🔐 Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_THUNDERFOREST_API_KEY=YOUR_THUNDERFOREST_API_KEY
```

Use the actual environment-variable names expected by the current codebase.

**Security notes:**

- Never commit `.env.local` or other secret-bearing environment files.
- Never expose the Supabase service-role key in frontend code.
- Keep privileged database operations on a trusted server.
- Apply appropriate database access policies before using sensitive operational information.
- Rotate any credential that has accidentally been committed publicly.

## 📊 Data and Reliability

ResQNova is a decision-support prototype, and its reliability depends on the quality and freshness of its data.

- Clearly distinguish simulated data from verified data.
- Do not treat a basemap as a live flood, traffic, or road-closure feed.
- Validate road geometry, resource coordinates, shelter capacities, and travel costs before operational use.
- Use realistic constraints when evaluating routing and optimization results.
- Record scenario inputs and optimization outputs so results can be reproduced.
- Require appropriate human review before operational decisions.

The platform is intended for research, prototyping, and decision-support demonstrations. It is not a substitute for official emergency alerts, verified navigation, or instructions from local emergency authorities.

## 🔮 Future Enhancements

- Validated, higher-resolution road graphs for the operational area.
- More robust flood-risk and demand-estimation models.
- Dynamic integration of verified road closures and hazard feeds.
- More complete A* and D* Lite integration and route-cost benchmarking.
- Classical optimization baselines and reproducible QAOA experiments.
- Improved shelter accessibility and capacity constraints.
- Audit trails, role-based permissions, and operational approval workflows.
- Automated evaluation of travel time, risk exposure, coverage, and allocation fairness.

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Keep changes scoped to a specific module.
4. Test the changes and document new configuration requirements.
5. Submit a pull request describing the implementation and validation performed.

Please avoid committing credentials, unverified real-world operational data, or claims of performance that have not been measured.

## 👥 Project Information

**Project:** ResQNova  
**Problem statement:** UC-077 — Disaster Resource Pre-Positioning and Evacuation Optimization  
**Primary operational focus:** Vijayawada, Andhra Pradesh, India

Built to explore how geospatial systems, graph algorithms, AI-assisted assessment, and optimization techniques can support proactive disaster preparedness.

**ResQNova — Plan Ahead. Route Smarter. Respond Better.**
