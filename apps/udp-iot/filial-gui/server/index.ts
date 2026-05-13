import dgram from "node:dgram";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { DeviceManager } from "./device-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../config/servidor.json");

const GUIPort = parseInt(process.env.FILIAL_GUI_PORT || "3002", 10);

const deviceManager = new DeviceManager();

function loadConfig(): void {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const data = JSON.parse(raw);
    deviceManager.setConfig(
      data.port ?? 51000,
      data.adminUser ?? "admin",
      data.adminPass ?? "admin",
    );
    deviceManager.init(data.devices ?? []);
    console.log(`Config loaded: ${deviceManager.count()} devices`);
  } catch {
    console.log("No config file found, using defaults");
    deviceManager.init([
      "actuator_light_sala",
      "sensor_light_sala",
      "actuator_ac_escritorio",
      "sensor_ac_escritorio",
      "actuator_light_cozinha",
      "sensor_light_cozinha",
    ]);
    saveConfig();
  }
}

function saveConfig(): void {
  const config = deviceManager.getConfig();
  const data = {
    port: config.port,
    adminUser: config.adminUser,
    adminPass: config.adminPass,
    devices: deviceManager.list(),
  };
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

function authenticate(user: unknown, pass: unknown): boolean {
  const config = deviceManager.getConfig();
  return user === config.adminUser && pass === config.adminPass;
}

function getDeviceList() {
  const all = deviceManager.getAll();
  return Object.entries(all).map(([id, state]) => ({
    id,
    isLight: state.isLight,
    isSensor: state.isSensor,
    boolValue: state.boolValue,
    intValue: state.intValue,
  }));
}

function getDeviceMap() {
  const all = deviceManager.getAll();
  const map: Record<string, string | number | boolean> = {};
  for (const [id, state] of Object.entries(all)) {
    map[id] = state.isLight ? state.boolValue : state.intValue;
  }
  return map;
}

// ── UDP Server ─────────────────────────────────────────────
function startUdpServer(port: number): dgram.Socket {
  const server = dgram.createSocket("udp4");

  server.on("message", (msg, rinfo) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(msg.toString("utf-8"));
    } catch {
      const errResp = Buffer.from(JSON.stringify({ error: "Invalid JSON" }));
      server.send(errResp, rinfo.port, rinfo.address);
      return;
    }

    const { cmd, user, pass, id, value } = parsed;

    if (!user || !pass) {
      const errResp = Buffer.from(
        JSON.stringify({ error: "Missing credentials" }),
      );
      server.send(errResp, rinfo.port, rinfo.address);
      return;
    }

    if (!authenticate(user, pass)) {
      const errResp = Buffer.from(JSON.stringify({ error: "Unauthorized" }));
      server.send(errResp, rinfo.port, rinfo.address);
      return;
    }

    let resp: Record<string, unknown>;

    switch (cmd) {
      case "list_req": {
        resp = { cmd: "list_resp", id: deviceManager.list() };
        break;
      }
      case "get_status": {
        resp = { cmd: "get_resp", ...getDeviceMap() };
        break;
      }
      case "set_req": {
        if (!id) {
          resp = { error: "Missing id" };
          break;
        }
        const device = deviceManager.get(id as string);
        if (!device) {
          resp = { error: "Device not found" };
          break;
        }
        if (device.isSensor) {
          resp = { error: "Read only" };
          break;
        }
        if (device.isLight) {
          deviceManager.set(id as string, value as boolean);
        } else {
          deviceManager.set(id as string, value as number);
        }
        saveConfig();
        notifyClients();
        resp = { cmd: "set_resp", id, value };
        break;
      }
      default: {
        resp = { error: "Unknown command" };
      }
    }

    const respBuf = Buffer.from(JSON.stringify(resp));
    server.send(respBuf, rinfo.port, rinfo.address);
  });

  server.on("error", (err) => {
    console.error("UDP server error:", err);
  });

  server.bind(port, () => {
    console.log(`UDP server listening on port ${port}`);
  });

  return server;
}

// ── HTTP + WebSocket Server ─────────────────────────────────
const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, udpRunning: true });
});

app.get("/api/devices", (_req, res) => {
  res.json(getDeviceList());
});

app.post("/api/devices", (req, res) => {
  const { id } = req.body;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  deviceManager.addDevice(id);
  saveConfig();
  notifyClients();
  res.status(201).json({ id });
});

app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const removed = deviceManager.removeDevice(id);
  if (!removed) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  saveConfig();
  notifyClients();
  res.json({ id, removed: true });
});

app.put("/api/devices/:oldId", (req, res) => {
  const { oldId } = req.params;
  const { newId } = req.body;
  if (!newId || typeof newId !== "string") {
    res.status(400).json({ error: "Missing newId" });
    return;
  }
  const updated = deviceManager.updateDevice(oldId, newId);
  if (!updated) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  saveConfig();
  notifyClients();
  res.json({ oldId, newId });
});

app.get("/api/config", (_req, res) => {
  const config = deviceManager.getConfig();
  res.json({ ...config, deviceCount: deviceManager.count() });
});

app.put("/api/config", (req, res) => {
  const { port, adminUser, adminPass } = req.body;
  if (!port || !adminUser || !adminPass) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  deviceManager.setConfig(
    parseInt(port, 10) || port,
    adminUser,
    adminPass,
  );
  saveConfig();
  res.json(deviceManager.getConfig());
});

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

function notifyClients(): void {
  const msg = JSON.stringify({ type: "devices_updated", devices: getDeviceList() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({ type: "devices_updated", devices: getDeviceList() }),
  );

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      switch (msg.type) {
        case "set_device": {
          const device = deviceManager.get(msg.id);
          if (!device) break;
          if (device.isSensor) break;
          if (device.isLight) {
            deviceManager.set(msg.id, !!msg.value);
          } else {
            deviceManager.set(msg.id, typeof msg.value === "number" ? msg.value : parseInt(msg.value, 10) || 0);
          }
          saveConfig();
          notifyClients();
          break;
        }
        case "add_device": {
          deviceManager.addDevice(msg.id);
          saveConfig();
          notifyClients();
          break;
        }
        case "remove_device": {
          deviceManager.removeDevice(msg.id);
          saveConfig();
          notifyClients();
          break;
        }
      }
    } catch {
      // ignore malformed WS messages
    }
  });
});

// ── Start ───────────────────────────────────────────────────
loadConfig();

const udpServer = startUdpServer(deviceManager.getConfig().port);

httpServer.listen(GUIPort, () => {
  console.log(`GUI server listening on http://localhost:${GUIPort}`);
  console.log(`WebSocket available at ws://localhost:${GUIPort}/ws`);
});

function shutdown(): void {
  console.log("\nShutting down...");
  udpServer.close();
  httpServer.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
