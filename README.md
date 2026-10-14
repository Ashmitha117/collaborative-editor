# 🚀 Real-Time Collaborative Code Editor

A full-stack, real-time collaborative code editor and execution environment built with **React 19**, **TypeScript**, **Yjs (CRDTs)**, **CodeMirror 6**, and **WebSockets**.

Designed for seamless peer-to-peer developer collaboration with zero-conflict document merging, live presence indicators, in-room chat, multi-language syntax autocompletion, instant code execution, and persistent storage.

---

## ✨ Features

- **⚡ Real-Time Collaborative Editing**:
  - Powered by **Yjs Conflict-free Replicated Data Types (CRDTs)** and `y-websocket` for eventual consistency and sub-millisecond synchronization.
  - Granular undo/redo tracking per user with `Y.UndoManager`.
- **👥 Live Multiplayer Presence**:
  - Dynamic user presence awareness showing connected peers, colored cursor flags, and active collaborator badges.
- **💬 Real-Time In-Room Chat**:
  - Room-based multiplayer chat persisted in the shared Yjs document state without requiring external chat APIs.
- **🌐 7 Programming Languages**:
  - Full syntax highlighting and custom autocompletion dictionaries for **JavaScript, Python, HTML, CSS, JSON, Markdown, and C++**.
- **▶ Client-Side Code Execution & Live Preview**:
  - **JavaScript**: In-browser execution sandbox capturing `console.log`, `warn`, `error`, return values, and execution timing.
  - **HTML & Markdown**: Live interactive sandbox preview with hot-rendering.
  - **Python & JSON**: Lightweight client-side evaluator and syntax validator.
- **🎨 Multi-Theme Support**:
  - High-contrast **Deep Space (Dark)**, **One Dark**, and **Clean Light** themes with unified editor and page styling.
- **💾 Import & Export**:
  - One-click file export with automatic extension formatting (`.js`, `.py`, `.html`, etc.).
  - File upload/import with auto-detection of syntax and transactional document insertion.
- **📦 Persistent Storage**:
  - Backend document persistence backed by **LevelDB** (`y-leveldb`) to preserve room history across server restarts.
- **⚡ Optimized Bundle Splitting**:
  - Rollup vendor code-splitting (`codemirror-core`, `codemirror-langs`, `react-vendor`, `yjs-vendor`) ensuring fast load times and sub-500 kB chunks.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7 |
| **Editor Core** | CodeMirror 6, `@codemirror/view`, `@codemirror/state`, `@codemirror/autocomplete`, `@codemirror/theme-one-dark` |
| **Multiplayer / CRDT** | Yjs, `y-websocket`, `y-codemirror.next`, `y-leveldb` |
| **Backend** | Node.js, Express, `ws` (WebSockets), LevelDB |
| **Testing & Quality** | Vitest, Oxlint |
| **DevOps & Container** | Docker (Multi-Stage Build), Docker Compose, Render Blueprint |

---

## 🏛 System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       Browser Clients                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ User A (CodeMirror 6) │       │ User B (CodeMirror 6) │  │
│  │ + Y.Doc Awareness     │       │ + Y.Doc Awareness     │  │
│  │ + In-Room Chat        │       │ + In-Room Chat        │  │
│  └───────────▲───────────┘       └───────────▲───────────┘  │
└──────────────┼───────────────────────────────┼──────────────┘
               │                               │
               │   WebSocket Sync (y-websocket)│
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js WebSocket Server                    │
│                 (Express + y-websocket)                     │
│                                                             │
│         ┌───────────────────────────────────────┐           │
│         │        Yjs Document Controller        │           │
│         └───────────────────┬───────────────────┘           │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │  LevelDB Storage Engine │
                 │      (backend/data)     │
                 └─────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v24.x`
- **npm**: `v10+` or `v12+`

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/collaborative-editor.git
cd collaborative-editor
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend WebSocket and API server starts on `http://localhost:1234`.

### 3. Start Frontend Client
In a new terminal window at the project root:
```bash
npm install
npm run dev
```
Visit **`http://localhost:5173`** to use the application.

---

## 🧪 Testing & Code Quality

Run unit tests via **Vitest**:
```bash
npm test
```

Run linter via **Oxlint**:
```bash
npm run lint
```

Build production assets:
```bash
npm run build
```

---

## 🐳 Docker Deployment

The repository includes a production-ready, multi-stage [`docker/Dockerfile`](docker/Dockerfile) and [`docker-compose.yml`](docker-compose.yml).

### Run with Docker Compose
```bash
docker compose up -d
```
The unified full-stack application will be live at `http://localhost:1234` with persistent LevelDB storage at named volume `collab-data`.

---

## 🌐 Cloud Deployment

Detailed step-by-step instructions for deploying to **Render**, **Railway**, **Fly.io**, and **Vercel** are available in [**`DEPLOYMENT.md`**](DEPLOYMENT.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
