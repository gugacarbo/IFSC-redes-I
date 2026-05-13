import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import dgram from "dgram";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.MATRIZ_PORT || "3001", 10);
const CONFIG_PATH = path.resolve(__dirname, "../config/matriz.json");

interface FilialConfig {
  name: string;
  ip: string;
  port: number;
}

interface AppConfig {
  user: string;
  pass: string;
  pollingMs: number;
  filiais: FilialConfig[];
}

let currentConfig: AppConfig;
const wsClients = new Set<WebSocket>();

function loadConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    const def: AppConfig = {
      user: "admin",
      pass: "admin",
      pollingMs: 5000,
      filiais: [{ name: "Filial Local", ip: "127.0.0.1", port: 51000 }],
    };
    saveConfig(def);
    return def;
  }
}

function saveConfig(cfg: AppConfig) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// ── UDP socket ──────────────────────────────────────────────
const udpSocket = dgram.createSocket("udp4");

udpSocket.on("message", (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString("utf-8"));
    const wsMsg = JSON.stringify({
      type: "ws_rx",
      source_ip: rinfo.address,
      payload: data,
    });
    for (const ws of wsClients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(wsMsg);
    }
  } catch (e) {
    console.error("UDP parse error:", e);
  }
});

/** Fire-and-forget UDP send. The response arrives asynchronously and is broadcast to all WS clients. */
function sendUdp(targetIp: string, targetPort: number, payload: object) {
  const buf = Buffer.from(JSON.stringify(payload));
  udpSocket.send(buf, targetPort, targetIp, (err) => {
    if (err) console.error(`UDP send error to ${targetIp}:${targetPort}`, err);
  });
}

// ── Polling ─────────────────────────────────────────────────
function pollAll() {
  for (const filial of currentConfig.filiais) {
    sendUdp(filial.ip, filial.port, {
      cmd: "list_req",
      user: currentConfig.user,
      pass: currentConfig.pass,
    });
    sendUdp(filial.ip, filial.port, {
      cmd: "get_status",
      user: currentConfig.user,
      pass: currentConfig.pass,
    });
  }
}

let pollingInterval: NodeJS.Timeout | null = null;

function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollAll();
  pollingInterval = setInterval(pollAll, currentConfig.pollingMs);
}

// ── Express + HTTP ─────────────────────────────────────────
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
    ],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/config", (_req, res) => res.json(currentConfig));
app.put("/api/config", (req, res) => {
  const newConfig: AppConfig = req.body;
  saveConfig(newConfig);
  currentConfig = newConfig;
  startPolling();
  res.json({ ok: true });
});

const server = http.createServer(app);

// ── WebSocket ───────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  wsClients.add(ws);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "ws_tx") {
        const filial = currentConfig.filiais.find((f) => f.ip === msg.target_ip);
        if (!filial) {
          ws.send(JSON.stringify({ type: "ws_error", message: `Filial com IP ${msg.target_ip} não encontrada` }));
          return;
        }
        const payload = {
          ...msg.payload,
          user: currentConfig.user,
          pass: currentConfig.pass,
        };
        sendUdp(msg.target_ip, filial.port, payload);
        // Response will arrive via UDP callback → broadcast as ws_rx to all clients
      }
    } catch (e) {
      console.error("WS message error:", e);
    }
  });

  ws.on("close", () => wsClients.delete(ws));
});

// ── Start ───────────────────────────────────────────────────
currentConfig = loadConfig();
udpSocket.bind(0, () => {
  console.log(`UDP socket bound to dynamic port ${udpSocket.address().port}`);
  startPolling();
});
server.listen(PORT, () => {
  console.log(`Matriz server listening on http://localhost:${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}/ws`);
});
