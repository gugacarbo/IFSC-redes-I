# UDP IoT — GUIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `matriz-gui` and `filial-gui` with direct UDP communication, working with both ESP32 and Java filial servers.

**Architecture:** Each GUI has a React (Vite) frontend communicating via local WebSocket to a Node.js backend that handles UDP sockets. The `filial-gui` backend IS a full UDP filial server with runtime device management.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind 4 (frontend), Node.js + Express + `ws` + `dgram` (backend), Java (existing filial server)

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
├── filial-gui/
│   ├── server/                      # CREATE: Node.js UDP server
│   │   ├── index.ts                 #   UDP server + WS API
│   │   ├── device-manager.ts        #   Device CRUD + state
│   │   └── tsconfig.json
│   ├── src/                         # REWRITE (was Vite boilerplate)
│   │   ├── hooks/
│   │   │   └── useFilial.ts
│   │   ├── components/
│   │   │   ├── dashboard.tsx
│   │   │   ├── device-editor.tsx
│   │   │   └── layout.tsx
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json                 # MODIFY: add deps + server scripts
│   └── vite.config.ts
└── java/                            # EXISTING (unmodified)
```

## Protocol (UDP — compatível com ESP32 e Java)

Every command includes `user` + `pass`:

| Cmd | Payload | Response |
|-----|---------|----------|
| `list_req` | `{"cmd":"list_req","user":"x","pass":"y"}` | `{"cmd":"list_resp","id":["actuator_light_sala",...]}` |
| `get_status` | `{"cmd":"get_status","user":"x","pass":"y"}` | `{"cmd":"get_resp","actuator_light_sala":true,"sensor_light_sala":false,"actuator_ac_escritorio":720}` |
| `set_req` | `{"cmd":"set_req","user":"x","pass":"y","id":"actuator_light_sala","value":true}` | `{"cmd":"set_resp","id":"actuator_light_sala","value":true}` |

Error responses: `{"error":"Invalid JSON"}` / `"Unauthorized"` / `"Device not found"` / `"Read only"`

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

### Task 3: filial-gui server (Node.js UDP server)

**Files:**
- Create: `apps/udp-iot/filial-gui/server/tsconfig.json`
- Create: `apps/udp-iot/filial-gui/server/device-manager.ts`
- Create: `apps/udp-iot/filial-gui/server/index.ts`

**What it does:**
- Full UDP server compatible with filial-esp32 protocol
- Listens on configurable UDP port (default 51000)
- DeviceManager: CRUD devices at runtime, state management
- WebSocket for React GUI
- REST API for device management + config

**Steps:**
- [ ] **3.1 Create `server/device-manager.ts`** — class `DeviceManager`:
  - `Map<string, DeviceState>` where `DeviceState = { isLight, boolVal, intVal, isSensor }`
  - `init(deviceIds: string[])` — create default states
  - `get(id)` / `set(id, bool)` / `set(id, int)` / `list()` / `getAll()`
  - `addDevice(id)` / `removeDevice(id)` / `updateDevice(oldId, newId)` — runtime management
  - `getConfig()` / `setConfig(port, user, pass)` — server config
  - Detect `isLight`: id contains `_light_`, `isSensor`: starts with `sensor_`
- [ ] **3.2 Create `server/index.ts`** — full application:
  - UDP socket listener (configurable port)
  - On datagram: parse JSON, authenticate (user/pass), route command, send response
  - Commands: `list_req` → `list_resp`, `get_status` → `get_resp`, `set_req` → `set_resp`
  - Error handling: `Invalid JSON`, `Missing credentials`, `Unauthorized`, `Device not found`, `Read only`, `Unknown command`
  - HTTP + WebSocket server on port 3002:
    - WS: sends device state updates, receives device management commands
    - REST: `GET /api/devices`, `POST /api/devices` (add), `DELETE /api/devices/:id`
    - REST: `GET /api/config`, `PUT /api/config` (port, user, pass, autostart)
  - Auto-save config to `config/servidor.json`
- [ ] **3.3 Add dependencies** — `ws`, `express`, `cors`, `@types/*`, `tsx`, `typescript`, `concurrently`
- [ ] **3.4 Update `filial-gui/package.json`**:
  ```json
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx server/index.ts",
    "dev:all": "concurrently \"npm run dev:server\" \"npm run dev\"",
    "build": "tsc -b && vite build",
    "build:server": "tsc -p server/tsconfig.json"
  }
  ```
- [ ] **3.5 Commit** `filial-gui: add Node.js UDP server`

### Task 4: filial-gui frontend — Build from scratch

**Files:**
- Create: `apps/udp-iot/filial-gui/src/types.ts`
- Create: `apps/udp-iot/filial-gui/src/hooks/useFilial.ts`
- Create: `apps/udp-iot/filial-gui/src/components/layout.tsx`
- Create: `apps/udp-iot/filial-gui/src/components/dashboard.tsx`
- Create: `apps/udp-iot/filial-gui/src/components/device-editor.tsx`
- Rewrite: `apps/udp-iot/filial-gui/src/App.tsx`
- Rewrite: `apps/udp-iot/filial-gui/src/index.css`
- Modify: `apps/udp-iot/filial-gui/index.html` — title, lang

**What it does:**
- React app with Tailwind CSS
- Dashboard showing all devices and their current states
- Device editor: add, remove, rename devices at runtime
- Server config: port, auth credentials
- Real-time updates via WebSocket

**Steps:**
- [ ] **4.1 Rewrite `index.html`** — title "Filial IoT", lang="pt-BR"
- [ ] **4.2 Rewrite `src/index.css`** — Tailwind import (`@import "tailwindcss"`)
- [ ] **4.3 Create `src/types.ts`** — shared types
- [ ] **4.4 Create `hooks/useFilial.ts`** — WebSocket connection to local server, CRUD operations:
  - `devices` state, `config` state
  - `addDevice(id)`, `removeDevice(id)`, `updateDevice(oldId, newId)`
  - `updateConfig(config)`
- [ ] **4.5 Create `components/layout.tsx`** — header with nav tabs, server status indicator
- [ ] **4.6 Create `components/dashboard.tsx`** — grid of device cards:
  - Each card: device ID, type icon (light/AC), current value
  - Light: boolean indicator (on/off), AC: numeric display
  - Sensor vs actuator marker
  - Read-only for sensors
- [ ] **4.7 Create `components/device-editor.tsx`** — form to:
  - Add new device: select type (light/ac), access (sensor/actuator), place name
  - Auto-generate ID: `actuator_light_sala` format
  - Remove existing device with confirmation
  - Edit device ID
- [ ] **4.8 Rewrite `App.tsx`** — tabs: Dashboard, Devices, Config
- [ ] **4.9 Add Tailwind to deps** — `tailwindcss`, `@tailwindcss/vite`
- [ ] **4.10 Update `vite.config.ts`** — add Tailwind plugin
- [ ] **4.11 Commit** `filial-gui: build React frontend`

### Task 5: Integration & verification

- [ ] **5.1 Install deps for both apps:** run `npm install` in matriz-gui and filial-gui
- [ ] **5.2 Build matriz-gui:** `npm run build` in matriz-gui
- [ ] **5.3 Build filial-gui:** `npm run build` in filial-gui
- [ ] **5.4 Manual test:** Start filial-gui server → start matriz-gui server → verify list/get/set works
- [ ] **5.5 Compatibility test:** Verify matriz-gui works with Java filial (`java -cp dist filial.FilialMain`)
