const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");

const persistenceDir = process.env.YPERSISTENCE || path.join(__dirname, "data");
process.env.YPERSISTENCE = persistenceDir;
if (!fs.existsSync(persistenceDir)) {
  fs.mkdirSync(persistenceDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", (req, res) => {
  res.json({
    message: "Collaborative Editor Backend Running 🚀",
    persistenceActive: Boolean(process.env.YPERSISTENCE),
    persistenceDir,
    serveFrontend: Boolean(process.env.SERVE_FRONTEND),
  });
});

const distPath = path.join(__dirname, "../dist");
const serveFrontend = fs.existsSync(distPath) && (process.env.SERVE_FRONTEND === "true" || process.env.NODE_ENV === "production");

if (serveFrontend) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Collaborative Editor Backend Running 🚀" });
  });
}

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  const handleAuth = (ws) => {
    wss.emit("connection", ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`HTTP + y-websocket server running on http://${HOST}:${PORT}`);
});