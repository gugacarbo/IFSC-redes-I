# Matriz GUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the React SPA (Single Page Application) that serves as the visual dashboard for the system. It connects to the Matriz ESP32 via WebSocket (for realtime UDP data) and HTTP (for config CRUD).

**Architecture:** React 19 + Vite. Uses `shadcn/ui` for components and TailwindCSS for styling. State management uses React hooks (`useState`/`useEffect`). The `WebSocket` API is used for real-time proxy events.

**Tech Stack:** React, Vite, shadcn/ui, TailwindCSS.

---

### Task 1: Setup React Project and Dependencies

**Files:**
- Modify: `apps/matriz-gui/package.json`
- Modify: `apps/matriz-gui/vite.config.ts`

- [ ] **Step 1: Bootstrap Vite + React**

Run: 
```bash
cd apps
npm create vite@latest matriz-gui -- --template react-ts
cd matriz-gui
npm install
```

- [ ] **Step 2: Setup Tailwind and shadcn/ui**

Run:
```bash
cd apps/matriz-gui
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 3: Update Vite config for relative paths and build output**

Modify `apps/matriz-gui/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../matriz-esp32/data/www', // Deploy straight to ESP32 LittleFS directory
    emptyOutDir: true,
  }
})
```

- [ ] **Step 4: Commit**

```bash
git add apps/matriz-gui/
git commit -m "feat(gui): setup vite, react, tailwind and build pipeline"
```

---

### Task 2: Core Layout and Navigation

**Files:**
- Create: `apps/matriz-gui/src/components/layout.tsx`
- Modify: `apps/matriz-gui/src/App.tsx`

- [ ] **Step 1: Create main layout wrapper**

```tsx
// apps/matriz-gui/src/components/layout.tsx
import { ReactNode } from "react";
import { Activity, Settings } from "lucide-react";

export function Layout({ children, currentTab, setTab }: { children: ReactNode, currentTab: string, setTab: (t: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">IoT Monitor</h1>
          <nav className="flex gap-4">
            <button 
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1 rounded ${currentTab === 'dashboard' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              <Activity size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setTab('config')}
              className={`flex items-center gap-2 px-3 py-1 rounded ${currentTab === 'config' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              <Settings size={18} /> Config
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx**

```tsx
// apps/matriz-gui/src/App.tsx
import { useState } from 'react'
import { Layout } from './components/layout'

function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <Layout currentTab={tab} setTab={setTab}>
      {tab === 'dashboard' ? (
        <div>Dashboard View (WIP)</div>
      ) : (
        <div>Config View (WIP)</div>
      )}
    </Layout>
  )
}

export default App
```

- [ ] **Step 3: Commit**

```bash
git add apps/matriz-gui/src/components/layout.tsx apps/matriz-gui/src/App.tsx
git commit -m "feat(gui): create base layout and navigation"
```

---

### Task 3: WebSocket Hook (Data Layer)

**Files:**
- Create: `apps/matriz-gui/src/hooks/useIoT.ts`

- [ ] **Step 1: Create the communication hook**

```typescript
// apps/matriz-gui/src/hooks/useIoT.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export type DeviceState = {
  [key: string]: boolean | number;
};

export type FilialData = {
  ip: string;
  devices: string[];
  state: DeviceState;
  lastSeen: number;
};

export function useIoT() {
  const [filiais, setFiliais] = useState<Record<string, FilialData>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // In production, connect to the host. In dev, connect to mocked/hardcoded IP
    const host = window.location.hostname === 'localhost' ? '192.168.1.100' : window.location.hostname;
    const ws = new WebSocket(`ws://${host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'ws_rx') {
          const ip = msg.source_ip;
          const payload = msg.payload;

          setFiliais(prev => {
            const current = prev[ip] || { ip, devices: [], state: {}, lastSeen: 0 };
            const newState = { ...current.state };
            let newDevices = [...current.devices];

            if (payload.cmd === 'list_resp' && Array.isArray(payload.id)) {
              newDevices = payload.id;
            } else if (payload.cmd === 'get_resp' || payload.cmd === 'set_resp') {
              // Extract device states
              Object.keys(payload).forEach(k => {
                if (k !== 'cmd' && k !== 'id' && k !== 'value') {
                  newState[k] = payload[k];
                }
              });
              // Handle single set_resp
              if (payload.id && payload.value !== undefined) {
                 newState[payload.id] = payload.value;
              }
            }

            return {
              ...prev,
              [ip]: {
                ...current,
                devices: newDevices,
                state: newState,
                lastSeen: Date.now()
              }
            };
          });
        }
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    return () => ws.close();
  }, []);

  const sendCommand = useCallback((targetIp: string, id: string, value: boolean | number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ws_tx',
        target_ip: targetIp,
        payload: {
          cmd: 'set_req',
          id,
          value
        }
      }));
    }
  }, []);

  return { filiais, connected, sendCommand };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/matriz-gui/src/hooks/useIoT.ts
git commit -m "feat(gui): implement websocket custom hook for global state"
```

---

### Task 4: Dashboard View

**Files:**
- Create: `apps/matriz-gui/src/components/dashboard.tsx`
- Modify: `apps/matriz-gui/src/App.tsx`

- [ ] **Step 1: Create Dashboard Component**

```tsx
// apps/matriz-gui/src/components/dashboard.tsx
import { FilialData } from "../hooks/useIoT";

export function Dashboard({ filiais, onCommand }: { filiais: Record<string, FilialData>, onCommand: (ip: string, id: string, val: boolean|number) => void }) {
  
  const entries = Object.values(filiais);

  if (entries.length === 0) {
    return <div className="text-center p-12 text-slate-500">Aguardando dados das filiais...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entries.map(filial => {
        const isOffline = Date.now() - filial.lastSeen > 15000; // 15s timeout
        
        return (
          <div key={filial.ip} className={`bg-white rounded-lg shadow border p-5 ${isOffline ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="font-bold text-lg text-slate-800">{filial.ip}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${isOffline ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>

            <div className="space-y-4">
              {filial.devices.map(dev => {
                const isLight = dev.includes('_light_');
                const isSensor = dev.startsWith('sensor_');
                const val = filial.state[dev];

                return (
                  <div key={dev} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-sm text-slate-700 font-medium truncate pr-2">{dev}</span>
                    
                    {isLight ? (
                      <button 
                        disabled={isSensor}
                        onClick={() => onCommand(filial.ip, dev, !val)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${val ? 'bg-emerald-500' : 'bg-slate-300'} ${isSensor ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${val ? 'left-6' : 'left-0.5'}`}></div>
                      </button>
                    ) : (
                      <input 
                        type="range" 
                        min="0" max="1023" 
                        disabled={isSensor}
                        value={(val as number) || 0}
                        onChange={(e) => onCommand(filial.ip, dev, parseInt(e.target.value))}
                        className={`w-24 ${isSensor ? 'cursor-not-allowed opacity-70' : ''}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx to use it**

```tsx
// apps/matriz-gui/src/App.tsx
import { useState } from 'react'
import { Layout } from './components/layout'
import { Dashboard } from './components/dashboard'
import { useIoT } from './hooks/useIoT'

function App() {
  const [tab, setTab] = useState('dashboard')
  const { filiais, connected, sendCommand } = useIoT()

  return (
    <Layout currentTab={tab} setTab={setTab}>
      {!connected && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm text-center">
          Desconectado da Matriz. Tentando reconectar...
        </div>
      )}
      
      {tab === 'dashboard' ? (
        <Dashboard filiais={filiais} onCommand={sendCommand} />
      ) : (
        <div>Config View (WIP)</div>
      )}
    </Layout>
  )
}

export default App
```

- [ ] **Step 3: Commit**

```bash
git add apps/matriz-gui/src/components/dashboard.tsx apps/matriz-gui/src/App.tsx
git commit -m "feat(gui): implement dashboard view and tie to websocket hook"
```

---

### Task 5: Config View (REST API)

**Files:**
- Create: `apps/matriz-gui/src/components/config.tsx`
- Modify: `apps/matriz-gui/src/App.tsx`

- [ ] **Step 1: Create Config Component**

```tsx
// apps/matriz-gui/src/components/config.tsx
import { useState, useEffect } from 'react';

type MatrizConfig = {
  user: string;
  pass: string;
  polling_ms: number;
  filiais: { name: string; ip: string; port: number }[];
};

export function ConfigView() {
  const [config, setConfig] = useState<MatrizConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => window.location.hostname === 'localhost' ? 'http://192.168.1.100/api/config' : '/api/config';

  useEffect(() => {
    fetch(getApiUrl())
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    if (!config) return;
    fetch(getApiUrl(), {
      method: 'PUT',
      body: JSON.stringify(config),
      headers: { 'Content-Type': 'application/json' }
    }).then(() => alert("Salvo com sucesso!"));
  };

  if (loading) return <div>Carregando...</div>;
  if (!config) return <div className="text-red-600">Falha ao carregar configurações.</div>;

  return (
    <div className="bg-white p-6 rounded shadow border">
      <h2 className="text-xl font-bold mb-6">Configurações da Matriz</h2>
      
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">Polling (ms)</label>
          <input 
            type="number" 
            className="border p-2 rounded w-full"
            value={config.polling_ms} 
            onChange={e => setConfig({...config, polling_ms: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <h3 className="font-bold mb-2">Filiais Cadastradas</h3>
      <div className="space-y-3 mb-6">
        {config.filiais.map((f, idx) => (
          <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border">
            <input 
              className="border p-1 rounded flex-1 text-sm" 
              value={f.name} 
              onChange={e => {
                const newF = [...config.filiais];
                newF[idx].name = e.target.value;
                setConfig({...config, filiais: newF});
              }}
              placeholder="Nome"
            />
            <input 
              className="border p-1 rounded flex-1 text-sm font-mono" 
              value={f.ip} 
              onChange={e => {
                const newF = [...config.filiais];
                newF[idx].ip = e.target.value;
                setConfig({...config, filiais: newF});
              }}
              placeholder="IP (ex: 10.0.0.1)"
            />
            <button 
              onClick={() => {
                const newF = config.filiais.filter((_, i) => i !== idx);
                setConfig({...config, filiais: newF});
              }}
              className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              X
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setConfig({...config, filiais: [...config.filiais, {name: 'Nova', ip: '', port: 51000}]})}
          className="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300"
        >
          + Adicionar Filial
        </button>
        
        <button 
          onClick={handleSave}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 ml-auto"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx to use it**

```tsx
// apps/matriz-gui/src/App.tsx
import { useState } from 'react'
import { Layout } from './components/layout'
import { Dashboard } from './components/dashboard'
import { ConfigView } from './components/config'
import { useIoT } from './hooks/useIoT'

function App() {
  const [tab, setTab] = useState('dashboard')
  const { filiais, connected, sendCommand } = useIoT()

  return (
    <Layout currentTab={tab} setTab={setTab}>
      {!connected && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm text-center">
          Desconectado da Matriz. Tentando reconectar...
        </div>
      )}
      
      {tab === 'dashboard' ? (
        <Dashboard filiais={filiais} onCommand={sendCommand} />
      ) : (
        <ConfigView />
      )}
    </Layout>
  )
}

export default App
```

- [ ] **Step 3: Commit**

```bash
git add apps/matriz-gui/src/components/config.tsx apps/matriz-gui/src/App.tsx
git commit -m "feat(gui): implement configuration view with rest api sync"
```
