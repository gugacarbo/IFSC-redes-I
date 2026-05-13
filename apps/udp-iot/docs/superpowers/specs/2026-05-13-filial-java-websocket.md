# WebSocket no filial-java

**Data:** 2026-05-13
**Status:** Aprovado

## Arquitetura

```
┌─ filial-gui (React + Vite, puro) ──────────────────┐
│  useFilial.ts → ws://host:PORT_HTTP/ws              │
│               → http://host:PORT_HTTP/api/*         │
└──────────────────────┬──────────────────────────────┘
                       │  WS + HTTP
                       ▼
┌─ filial-java ─────────────────────────────────────────┐
│                                                        │
│  AppServer (TCP single-port, HTTP + WS)                │
│    ├─ WebSocketSession ←→ DeviceBridge → DeviceManager │
│    └─ ApiHandler (REST: devices, config, health)       │
│                                                        │
│  UdpServer (port UDP) ←→ CommandProcessor              │
│                              → DeviceManager           │
└──────────────────────────┬─────────────────────────────┘
                           │ UDP (list_req/get_status/set_req)
                           ▼
                        Matriz
```

O `DeviceBridge` conecta GUI ↔ `DeviceManager` local (diferente do `BridgeManager` da matriz que faz WS → UDP remoto).

## Componentes

### 1. `AppServer.java` (novo)

Igual ao `matriz-java/src/matriz/AppServer.java`:

- `ServerSocket` single-port
- Accept loop em daemon thread, pool de conexões (`ExecutorService`)
- Lê headers HTTP, decide: `Upgrade: websocket` → `WebSocketSession`, senão → `ApiHandler`
- Suporta CORS (`Access-Control-Allow-Origin: *`)
- Timeout de 15s por conexão
- Porta via `FilialConfig.httpPort` (env: `FILIAL_HTTP_PORT`)

### 2. `WebSocketSession.java` (novo, copiado da matriz)

RFC 6455 raw — sem dependências externas:
- Handshake HTTP Upgrade (SHA-1 + Base64)
- Frame read/write (text, close, ping/pong)
- Masking/unmasking (client → server)
- Graceful close

### 3. `ApiHandler.java` (novo)

REST API (mesmo padrão `matriz-java/src/matriz/ApiHandler.java`):

| Método | Rota | Corpo | Resposta | Descrição |
|--------|------|-------|----------|-----------|
| `GET` | `/api/devices` | — | `[{id, isLight, isSensor, boolValue, intValue}, ...]` | Lista todos devices |
| `POST` | `/api/devices` | `{"id":"..."}` | `{"id":"..."}` (201) | Adiciona device |
| `DELETE` | `/api/devices/:id` | — | `{"id":"...", "removed":true}` | Remove device |
| `PUT` | `/api/devices/:oldId` | `{"newId":"..."}` | `{"oldId":"...", "newId":"..."}` | Renomeia device |
| `GET` | `/api/config` | — | `{port, adminUser, adminPass, deviceCount}` | Config atual |
| `PUT` | `/api/config` | `{port, adminUser, adminPass}` | `{port, adminUser, adminPass}` | Atualiza config |
| `GET` | `/health` | — | `{"status":"ok","devices":N}` | Health check |
| `OPTIONS` | *qualquer* | — | 204 | CORS preflight |

### 4. `DeviceBridge.java` (novo)

Gerencia sessões WebSocket e roteia mensagens:

- **onSessionOpened(session):** registra sessão, envia estado atual (`devices_updated`)
- **onSessionClosed(session):** remove da lista
- **sessionReadLoop(session):** blocking loop lendo frames
- **Mensagens do cliente:**
  - `{"type":"set_device","id":"...","value":...}` — seta device, broadcast
  - `{"type":"add_device","id":"..."}` — adiciona, salva config, broadcast
  - `{"type":"remove_device","id":"..."}` — remove, salva config, broadcast
- **broadcast(json):** envia pra todas as sessões abertas
- Toda operação que modifica estado faz broadcast automático

## Config

Novo campo no `config/config_filial.json`:

```json
{
  "port": 51000,
  "http_port": 8082,
  "admin_user": "admin",
  "admin_pass": "admin",
  "id": ["actuator_light_sala", "sensor_light_sala", "actuator_ac_escritorio", "sensor_ac_escritorio"]
}
```

- `FilialConfig` ganha campo `httpPort` (int)
- `ConfigManager` carrega `http_port` do JSON
- `.env`: `FILIAL_HTTP_PORT` sobrescreve (default 8082)

## FilialMain.java

Nova sequência de inicialização:

1. Load config
2. `DeviceManager.init(deviceIds)`
3. `UdpServer.start()` (UDP p/ Matriz)
4. `DeviceBridge(deviceManager, configManager)` — bridge WS
5. `ApiHandler(configManager, deviceManager, deviceBridge)` — REST
6. `AppServer.start(httpPort, deviceBridge, apiHandler)` — HTTP+WS
7. Shutdown hook: para AppServer + UdpServer

## Mudanças no filial-gui

- Remover diretório `server/` (Node.js server)
- `useFilial.ts`:
  - `VITE_FILIAL_API_URL` default → `http://localhost:8082`
  - `VITE_FILIAL_WS_URL` default → `ws://localhost:8082/ws`
- Vite dev server na porta 5174 (apenas frontend)
- Nenhuma outra mudança no React — `useFilial` hook já é compatível com a API REST + WS do Java

## Observações

- DeviceManager já é thread-safe (`ConcurrentHashMap`) — seguro compartilhar entre UDP server e WebSocket
- ConfigManager precisa ser thread-safe (operações de save via ApiHandler podem conflitar com leitura do UDP server)
- DeviceBridge NOTIFICA clients via broadcast a cada mudança (tanto via WS quanto via UDP: se Matriz muda estado via UDP, o broadcast avisa a GUI)
