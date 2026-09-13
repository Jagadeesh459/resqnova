# ==============================================================================
# ResQNova Production Dockerfile for Render / Cloud Containers
# Combines Node.js 22 LTS (Full Stack Express + React) & Python 3.12 (A* + D* Lite Dynamic Routing)
# ==============================================================================

FROM python:3.12-slim-bookworm

# 1. Install system utilities and Node.js 22 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install Python Dynamic Routing dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 3. Install Node.js dependencies
COPY package*.json ./
RUN npm ci

# 4. Copy application source code
COPY . .

# 5. Build Vite frontend bundle and compile Express server into dist/
RUN npm run build

# 6. Environment & Port configuration
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PATH=python3

EXPOSE 3000

# 7. Launch unified production server
CMD ["node", "dist/server.cjs"]
