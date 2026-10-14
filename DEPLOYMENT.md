# Deployment Guide

This project can be deployed either as a **Unified Full-Stack App** (Frontend served by Backend Node/Docker server) or as a **Decoupled Architecture** (Static Frontend on Vercel/Netlify + WebSocket Backend on Render/Railway).

---

## Option 1: Unified Full-Stack Deployment (Recommended)

In this mode, the Node backend serves both the WebSocket connection and the pre-built React frontend static files from `dist/`.

### 1. Deploy with Docker (Render / Railway / Fly.io / VPS)

The provided [`docker/Dockerfile`](docker/Dockerfile) uses multi-stage builds to build the Vite frontend and bundle the backend into a lightweight production container.

#### Local Docker Run
```bash
docker compose up -d
```
Then visit `http://localhost:1234`.

#### Deploy to Render via Blueprint
1. Push your repository to GitHub or GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Blueprint**.
3. Connect your repository. Render will automatically detect [`render.yaml`](render.yaml).
4. Render mounts a persistent 1 GB disk at `/app/data` to persist Yjs room document histories across restarts.

#### Deploy to Railway
1. Go to [Railway.app](https://railway.app/) -> **New Project** -> **Deploy from GitHub repo**.
2. Select this repository. Railway will detect `docker/Dockerfile`.
3. Under **Variables**, set:
   - `PORT=1234`
   - `YPERSISTENCE=/app/data`
   - `SERVE_FRONTEND=true`
4. Add a Persistent Volume mounted at `/app/data`.
5. Under **Settings** -> **Networking**, generate a public domain.

#### Deploy to Fly.io
```bash
fly launch --dockerfile docker/Dockerfile
fly volumes create collab_data --size 1
fly deploy
```

---

## Option 2: Decoupled Deployment

Deploy frontend and backend separately.

### Step 1: Deploy Backend (WebSocket Server)
1. Deploy the `backend/` folder to a Node.js host (Railway, Render, or a VPS).
2. Set environment variables:
   - `PORT=1234` (or host-assigned port)
   - `YPERSISTENCE=./data`
   - `SERVE_FRONTEND=false`
3. Note your backend URL (e.g., `https://my-collab-backend.onrender.com`).

### Step 2: Deploy Frontend (Vercel / Netlify / Cloudflare Pages)
1. Connect your repository to Vercel or Netlify.
2. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Frontend Environment Variable:
   - `VITE_WS_URL`: `wss://my-collab-backend.onrender.com`
4. Deploy!

---

## Environment Variables Reference

| Variable | Target | Description | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | HTTP and WebSocket listening port | `1234` |
| `HOST` | Backend | Host bind address | `0.0.0.0` |
| `YPERSISTENCE` | Backend | Directory path for Yjs LevelDB persistence | `./data` |
| `SERVE_FRONTEND` | Backend | Set to `true` to serve frontend `dist/` over HTTP | `false` |
| `VITE_WS_URL` | Frontend | WebSocket endpoint for remote backend | `ws://localhost:1234` |
