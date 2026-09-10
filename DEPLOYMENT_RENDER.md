# 🚀 ResQNova: Complete Deployment Guide for Render.com

This guide provides step-by-step instructions to deploy **ResQNova (Disaster Management Platform)** on [Render.com](https://render.com) with full support for:
- **Node.js 22 LTS** (React 19 + Express full-stack host)
- **Python 3.12** (Authentic Qiskit 2.5 QAOA/QUBO optimization engine)
- **Google Gemini API** (Multi-modal flood diagnostics and triage)
- **Real-time Server-Sent Events (SSE)** telemetry

---

## 🌟 Method 1: Docker Deployment (Recommended - 100% Guaranteed)

Because ResQNova is a hybrid system (Node.js + Python Qiskit 2.5 with scientific C-extensions like `docplex` and `scipy`), deploying via **Docker** guarantees that both runtimes and system libraries are perfectly configured.

### Step 1: Push Your Code to GitHub / GitLab
Make sure your latest code (including `Dockerfile`, `render.yaml`, `requirements.txt`) is committed and pushed:
```bash
git add .
git commit -m "feat: configure Render Docker deployment & Qiskit QAOA"
git push origin main
```

### Step 2: Create a New Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top right corner and select **Web Service**.
3. Connect your Git repository (`resqnova---disaster-management-platform`).
4. Fill in the service configuration:
   - **Name**: `resqnova` (or your preferred name)
   - **Region**: Choose the closest region (e.g., *Singapore* or *Oregon*)
   - **Branch**: `main`
   - **Language / Runtime**: Select **Docker**
   - **Plan**: **Free**
5. Under **Advanced** $\to$ **Environment Variables**, add the following:

| Key | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables optimized production build serving |
| `PORT` | `3000` | Port handled by Render router |
| `PYTHON_PATH` | `python3` | Explicit Python binary path inside container |
| `GEMINI_API_KEY` | *(Your Gemini API Key)* | Required for AI diagnostics and triage |

6. Click **Deploy Web Service**.
7. Render will automatically build the Docker container, install Qiskit, run the verification test, and start the app at `https://resqnova.onrender.com`.

---

## 🌟 Method 2: 1-Click Deploy via Render Blueprints

Render supports declarative infrastructure using the included `render.yaml` file:

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** $\to$ **Blueprint**.
3. Select your repository.
4. Render detects `render.yaml` and will ask you for any un-synced variables (like `GEMINI_API_KEY`).
5. Click **Apply**. Render sets up the web service, health checks (`/api/health`), and automated CI/CD deployments.

---

## 🌟 Method 3: Native Environment (Alternative)

If you prefer not to use Docker and want Render's native Node.js environment:

1. In Render, select **Runtime**: **Node**.
2. **Build Command**:
   ```bash
   chmod +x render-build.sh && ./render-build.sh
   ```
3. **Start Command**:
   ```bash
   node dist/server.cjs
   ```
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Your key)*

---

## 🔍 How to Verify Deployment Health

Once the deployment finishes:
1. Open `https://<your-service-name>.onrender.com/api/health`
   Expected response:
   ```json
   {
     "status": "ok",
     "system": "ResQNova Emergency Command Engine",
     "district": "Vijayawada / NTR District, AP",
     "geminiConfigured": true
   }
   ```
2. Open `https://<your-service-name>.onrender.com/api/quantum/engine-info`
   Expected response:
   ```json
   {
     "primary_engine": "Qiskit 2.5.2 (Python 3.12 QAOA / QUBO)",
     "fallback_engine": "ResQNova Statevector Simulator (Pure TypeScript)",
     "python_service_available": true
   }
   ```
3. Open the web app at `https://<your-service-name>.onrender.com`.
   - Test **Citizen SOS**: Submit an SOS request.
   - Test **Quantum Optimization**: Go to **Quantum Pre-Position** and click **Run QAOA Optimization**.
   - Test **Role Gateway**: Click **Switch Persona** in the sidebar to toggle between Citizen, Rescue Squad, 108 Ambulance, Shelter, Hospital, and Command Dashboard.

