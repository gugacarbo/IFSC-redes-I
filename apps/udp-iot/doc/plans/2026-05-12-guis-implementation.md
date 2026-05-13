# UDP IoT — GUIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `matriz-gui` and `filial-gui` with direct UDP communication, working with ESP32 and Java filial servers.

**Architecture:**
- `matriz-gui`: Node.js bridge (WebSocket client ↔ UDP server) connecting to ESP32/Java filial servers
- `filial-gui`: React app connecting directly to ESP32 or Java via WebSocket (no Node.js backend)

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind 4 (frontend), Node.js + Express + `ws` + `dgram` (matriz bridge only)

---

## File Structure

```
apps/udp-iot/
├── matriz-gui/                      # ← REFACTOR
│   ├── server/                      # CREATE: Node.js UDP bridge
│   │   ├── index.ts                 #   Express + WS + UDP bridge
│   │   └── tsconfig.json
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useIoT.ts           # MODIFY: conn. to local server
│   │   ├── components/
│   │   │   ├── layout.tsx           # MODIFY: show conn. status
│   │   │   ├── dashboard.tsx        # MODIFY: include user/pass
│   │   │   └── config.tsx           # REWRITE: standalone config
│   │   ├── types.ts                 # CREATE: shared types
│   │   ├── App.tsx                  # MODIFY: wire up
│   │   └── main.tsx
│   ├── package.json                 # MODIFY: add server scripts
│   └── vite.config.ts
├── filial-gui/                      # REWRITE: no server, direct WS
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useFilial.ts         # CREATE: WS to ESP32/Java
│   │   ├── components/
│   │   │   ├── dashboard.tsx
│   │   │   ├── device-editor.tsx
│   │   │   └── layout.tsx
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── vite.config.ts
└── java/                            # EXISTING (unmodified)
```

---

## Protocol (UDP — compatível com ESP32 e Java)

Every command includes `user` + `pass`:

| Cmd | Payload | Response |
|-----|---------|----------|
| `list_req` | `{"cmd":"list_req","user":"x","pass":"y"}` | `{"cmd":"list_resp","id":["actuator_light_sala",...]}` |
| `get_status` | `{"cmd":"get_status","user":"x","pass":"y"}` | `{"cmd":"get_resp","actuator_light_sala":true,"sensor_light_sala":false,"actuator_ac_escritorio":720}` |
| `set_req` | `{"cmd":"set_req","user":"x","pass":"y","id":"actuator_light_sala","value":true}` | `{"cmd":"set_resp","id":"actuator_light_sala","value":true}` |

Error responses: `{"error":"Invalid JSON"}` / `"Unauthorized"` / `"Device not found"` / `"Read only"`

---

## Protocol (WebSocket — filial-gui ↔ ESP32/Java)

The filial WebSocket server (ESP32 or Java) exposes the same UDP protocol over WS:

| WS Message Type | Payload | Response |
|-----------------|---------|----------|
| `list_req` | `{"type":"list_req","user":"x","pass":"y"}` | `{"type":"list_resp","id":["actuator_light_sala",...]}` |
| `get_status` | `{"type":"get_status","user":"x","pass":"y"}` | `{"type":"get_resp",...}` |
| `set_req` | `{"type":"set_req","user":"x","pass":"y","id":"...","value":...}` | `{"type":"set_resp","id":"...","value":...}` |
| `update` | (server → client) | `{"type":"update","devices":[{id,boolValue?,intValue?}]}` |

---

### Task 1: matriz-gui server (Node.js UDP bridge)

**Files:**
- Create: `apps/udp-iot/matriz-gui/server/tsconfig.json`
- Create: `apps/udp-iot/matriz-gui/server/index.ts`

**What it does:**
- HTTP server on port 3001 (configurable via env `MATRIZ_PORT`)
- WebSocket endpoint `/ws` for React frontend
- REST endpoints: `GET /api/status`, `POST /api/poll`
- UDP bridge: receives `ws_tx` messages from frontend, sends UDP to target filial IP:port, returns response as `ws_rx`
- Auth: injects configured `user`/`pass` into every outgoing command
- Polling: sends `list_req` + `get_status` periodically to all configured filiais

**Steps:**
- [ ] **1.1 Create `server/tsconfig.json`** — target ES2022, module NodeNext
- [ ] **1.2 Create `server/index.ts`** — Express app with:
  - `ws` WebSocket server on same HTTP server
  - `dgram` UDP socket
  - In-memory config: `{ user, pass, pollingMs, filiais: [{name, ip, port}] }`
  - WS message handler: parse `ws_tx`, inject `user`/`pass`, send UDP, forward response as `ws_rx`
  - Polling loop: `setInterval` sending `list_req` + `get_status` to each filial, broadcasting `ws_rx` responses
  - REST: `GET /api/config` returns config, `PUT /api/config` updates config
  - CORS for Vite dev server (localhost:5173)
- [ ] **1.3 Add dependencies** — `ws`, `express`, `cors`, `@types/ws`, `@types/express`, `@types/cors`, `tsx` (for dev), `typescript`
- [ ] **1.4 Update `matriz-gui/package.json`** — add scripts:
  ```json
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx server/index.ts",
    "dev:all": "concurrently \"npm run dev:server\" \"npm run dev\"",
    "build": "tsc -b && vite build",
    "build:server": "tsc -p server/tsconfig.json"
  }
  ```
- [ ] **1.5 Commit** `matriz-gui: add Node.js UDP bridge server`

### Task 2: matriz-gui frontend — Refactor for local bridge

**Files:**
- Create: `apps/udp-iot/matriz-gui/src/types.ts`
- Modify: `apps/udp-iot/matriz-gui/src/hooks/useIoT.ts`
- Modify: `apps/udp-iot/matriz-gui/src/components/dashboard.tsx`
- Rewrite: `apps/udp-iot/matriz-gui/src/components/config.tsx`
- Modify: `apps/udp-iot/matriz-gui/src/App.tsx`

**What it does:**
- React app connects to local Node.js server via WebSocket (`ws://localhost:3001/ws`)
- Fetches config from `GET /api/config`
- Dashboard shows devices per filial, allows setting actuators
- Config view manages filiais list, polling, credentials

**Steps:**
- [ ] **2.1 Create `src/types.ts`** — shared types:
  ```ts
  export type DeviceType = 'light' | 'ac';
  export type DeviceAccess = 'sensor' | 'actuator';
  export interface FilialConfig { name: string; ip: string; port: number; }
  export interface MatrizConfig { user: string; pass: string; pollingMs: number; filiais: FilialConfig[]; }
  export interface FilialData { ip: string; devices: string[]; state: Record<string, boolean|number>; lastSeen: number; online: boolean; }
  export interface WsMessage { type: 'ws_tx'|'ws_rx'; target_ip?: string; source_ip?: string; payload: Record<string, unknown>; }
  ```
- [ ] **2.2 Rewrite `hooks/useIoT.ts`** — connect to `ws://localhost:3001/ws`, handle:
  - `ws_rx` messages → update filial states
  - `sendCommand(targetIp, id, value)` → send `ws_tx` with `set_req`
  - Auto-reconnect on disconnect
  - Fetch config from `http://localhost:3001/api/config`
  - Polling with configurable interval (sent by server, frontend just displays)
- [ ] **2.3 Update `components/dashboard.tsx`** — already mostly correct, ensure:
  - Shows devices per filial with name from config (not just IP)
  - Light: toggle switch, AC: range slider 0-1023
  - Sensors are read-only (disabled controls)
  - Online/offline status based on `lastSeen` (< 15s)
  - Shows polling interval and credentials in header
- [ ] **2.4 Rewrite `components/config.tsx`** — standalone config management:
  - Load/save config via `GET/PUT /api/config`
  - List of filiais: name, IP, port (add/remove/edit)
  - Credentials (user/pass) for all filiais
  - Polling interval (ms)
  - Connection test button per filial
- [ ] **2.5 Update `App.tsx`** — pass connection status, handle loading states, show server connection status
- [ ] **2.6 Commit** `matriz-gui: refactor frontend for local bridge`

### Task 3: filial-gui frontend — Build from scratch (no server)

**Files:**
- Rewrite: `apps/udp-iot/filial-gui/src/types.ts`
- Create: `apps/udp-iot/filial-gui/src/hooks/useFilial.ts`
- Create: `apps/udp-iot/filial-gui/src/components/layout.tsx`
- Create: `apps/udp-iot/filial-gui/src/components/dashboard.tsx`
- Create: `apps/udp-iot/filial-gui/src/components/device-editor.tsx`
- Rewrite: `apps/udp-iot/filial-gui/src/App.tsx`
- Rewrite: `apps/udp-iot/filial-gui/src/index.css`
- Modify: `apps/udp-iot/filial-gui/index.html` — title, lang

**What it does:**
- React app connects directly to ESP32 or Java WebSocket server
- No Node.js backend — connects to `ws://<esp32-ip>:<port>/ws` or `ws://localhost:<port>/ws`
- Dashboard showing all devices and their current states
- Device editor: add, remove, rename devices at runtime (via ESP32/Java API)
- Server config: ESP32/Java server URL, auth credentials
- Real-time updates via WebSocket

**Steps:**
- [ ] **3.1 Rewrite `index.html`** — title "Filial IoT", lang="pt-BR"
- [ ] **3.2 Rewrite `src/index.css`** — Tailwind import (`@import "tailwindcss"`)
- [ ] **3.3 Create `src/types.ts`** — shared types for filial devices
- [ ] **3.4 Create `hooks/useFilial.ts`** — WebSocket connection to ESP32/Java server:
  - `serverUrl` state (configurable by user)
  - `devices` state, `config` state
  - Handles WS message types: `list_resp`, `get_resp`, `set_resp`, `update`
  - Auto-reconnect on disconnect
- [ ] **3.5 Create `components/layout.tsx`** — header with nav tabs, server status indicator, server URL input
- [ ] **3.6 Create `components/dashboard.tsx`** — grid of device cards:
  - Each card: device ID, type icon (light/AC), current value
  - Light: boolean indicator (on/off), AC: numeric display
  - Sensor vs actuator marker
  - Read-only for sensors
- [ ] **3.7 Create `components/device-editor.tsx`** — form to:
  - Note: device management depends on ESP32/Java REST API (if available)
  - Display current devices
- [ ] **3.8 Rewrite `App.tsx`** — tabs: Dashboard, Config
- [ ] **3.9 Update `vite.config.ts`** — ensure Tailwind plugin
- [ ] **3.10 Commit** `filial-gui: build React frontend (direct WS to ESP32/Java)`

### Task 4: Integration & verification

- [ ] **4.1 Install deps for matriz-gui:** run `npm install` in matriz-gui
- [ ] **4.2 Install deps for filial-gui:** run `npm install` in filial-gui
- [ ] **4.3 Build matriz-gui:** `npm run build` in matriz-gui
- [ ] **4.4 Build filial-gui:** `npm run build` in filial-gui
- [ ] **4.5 Manual test:** Start Java filial → start matriz-gui server → verify list/get/set works
- [ ] **4.6 Compatibility test:** Verify filial-gui works with Java filial (`java -cp dist filial.FilialMain`)
