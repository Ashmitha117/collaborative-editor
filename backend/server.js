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

const { spawn } = require("child_process");

app.get("/status", (req, res) => {
  res.json({
    message: "Collaborative Editor Backend Running 🚀",
    persistenceActive: Boolean(process.env.YPERSISTENCE),
    persistenceDir,
    serveFrontend: Boolean(process.env.SERVE_FRONTEND),
  });
});

app.post("/run", (req, res) => {
  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const startTime = Date.now();

  if (language === "python") {
    // Try executing with native Python
    const pythonProc = spawn("python", ["-u", "-c", code], {
      timeout: 8000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let stdout = "";
    let stderr = "";

    pythonProc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProc.on("close", (exitCode) => {
      const executionTimeMs = Date.now() - startTime;
      res.json({
        stdout,
        stderr,
        exitCode: exitCode ?? 0,
        executionTimeMs,
      });
    });

    pythonProc.on("error", (err) => {
      res.status(500).json({
        error: `Python execution error: ${err.message}`,
        executionTimeMs: Date.now() - startTime,
      });
    });
    return;
  }

  res.status(400).json({ error: `Language ${language} not supported for remote run` });
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