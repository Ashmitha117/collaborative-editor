# Collaborative Editor

This project is a real-time collaborative code editor built with React, Vite, Yjs, and CodeMirror.

## Features

- Real-time collaborative editing with Yjs and y-websocket
- Room-based sharing using UUID links
- Presence avatars and local user labels
- JavaScript/Python syntax highlighting
- Autocomplete suggestions for JavaScript and Python keywords
- Recent room persistence in localStorage

## Run locally

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend supports Yjs persistence using `y-leveldb`. By default it stores document history in `backend/data`.

To explicitly set a persistence directory:

```bash
YPERSISTENCE=./backend/data npm run dev
```

To start without persistence, unset `YPERSISTENCE` before running the server.

#### Production deployment with built frontend

After building the frontend, the backend can also serve the production app from `../dist`.

```bash
npm install
npm run build
cd backend
SERVE_FRONTEND=true YPERSISTENCE=./backend/data PORT=1234 npm start
```

If your app is deployed separately, keep `VITE_WS_URL` set to the backend WebSocket URL.

### Frontend

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Deployment

### Backend

Deploy the backend folder to a Node.js host or container.
Set `PORT` if needed (default: `1234`). Example:

```bash
PORT=1234 node server.js
```

If you host the backend behind a reverse proxy, ensure WebSocket upgrade support is enabled.

### Frontend

Build the frontend and deploy the `dist/` output to your static host.

```bash
npm run build
```

If the backend is hosted at a different URL, set the frontend env variable:

```env
VITE_WS_URL=wss://your-backend-host.example.com
```

Then restart the frontend dev server or rebuild.

For production backend deployment, make sure `YPERSISTENCE` points to a writable folder so document history can survive restarts.

### Docker deployment

Build and run the container from the repo root:

```bash
docker build -f docker/Dockerfile -t collab-editor .
docker run -p 1234:1234 collab-editor
```

The container starts the backend with frontend serving enabled and persistence active at `./data`.

## Notes

- By default, the editor will connect to the same origin with the correct `ws://` or `wss://` scheme.
- Use `VITE_WS_URL` for remote or production backends.
