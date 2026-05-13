# Console Log Viewer — Design Doc

**Date:** 2026-05-13
**Status:** Draft

## Problem

As GUIs (filial-gui e matriz-gui) não têm visibilidade do que está acontecendo no servidor. Toda saída de console/stdout (Java) ou Serial (ESP32) fica apenas no terminal onde o servidor foi iniciado. O usuário precisa alternar entre abas do terminal e o navegador para depurar.

## Solution

Adicionar uma aba **Console** em cada GUI que espelha stdout/Serial em tempo real, usando a conexão WebSocket existente + um ring buffer para backlog.

### Message Format

```json
{
  "type": "log",
  "level": "info",
  "message": "UDP server listening on port 51000",
  "ts": 1715123456789
}
```

- `level`: `"info"` (stdout) ou `"error"` (stderr)
- `ts`: epoch milliseconds
- Transmitido pela conexão WebSocket existente (mesma conexão dos comandos de dispositivo)

### REST Endpoint

```
GET /api/logs?limit=200
→ [{ "level": "info", "message": "...", "ts": 1715123456000 }, ...]
```

Array ordenado do mais antigo pro mais recente.

---

## Architecture

### 1. Java (shared — `packages/udp-shared`)

Nova classe `LogCapture`:

```
packages/udp-shared/src/shared/LogCapture.java
```

**Ring buffer**: `ConcurrentLinkedDeque<LogEntry>` com capacidade máxima configurável (default 500). Thread-safe, lock-free.

**PrintStream tee**: Cria um `PrintStream` customizado que sobrescreve `println(String)` para:
1. Chamar o `System.out` original (console real)
2. Adicionar ao ring buffer como `LogEntry(level="info", message, ts)`
3. Se houver um listener registrado, chamar `listener.accept(json)`

**Instalação em `FilialMain.main()` / `MatrizMain.main()`**:
```java
LogCapture logCapture = new LogCapture(500);
logCapture.install();  // System.setOut + System.setErr
```

**Listener para WS broadcast**:
```java
// Depois de criar DeviceBridge/BridgeManager:
logCapture.setBroadcastListener(json -> deviceBridge.broadcast(json));
```

**Fornece entries pro REST**:
```java
logCapture.getEntries(limit); // List<LogEntry> mais recentes primeiro
```

### 2. ESP32 (filial-esp32, matriz-esp32)

Nova classe `LogCapture`:

```
applications/filial-esp32/src/LogCapture.h
applications/filial-esp32/src/LogCapture.cpp
```

**Ring buffer**: Array circular de `String[500]` com índice envolvente. Mutex (semáforo) para thread-safety.

**API**:
```cpp
class LogCapture {
public:
    static void begin(size_t ringSize = 500);
    static void println(const char* msg, const char* level = "info");
    static void printf(const char* fmt, ...);
    static void error(const char* msg);
    static String getEntries(int limit);
    static void setBroadcastCallback(void (*cb)(const char* json));
};
```

**Uso**: `LogCapture::println("mensagem")` substitui `Serial.println("mensagem")` nos pontos principais. Internamente chama `Serial.println` + ring buffer + WS broadcast via callback.

### 3. Integração com WebSocket Bridge

**Filial** (`DeviceBridge.java` / `DeviceBridge.cpp`):
- Novo método `broadcastLog(String json)` que formata e envia pra todos os WS clients
- O `LogCapture` chama esse método via callback

**Matriz** (`BridgeManager.java` / `BridgeManager.cpp`):
- Mesmo padrão — `broadcastLog(String json)` existente reusado (o `broadcast` genérico já existe)

### 4. API REST (`ApiHandler.java` / `ApiServer.cpp`)

Novas rotas:

| Method | Path | Descrição |
|--------|------|-----------|
| GET | `/api/logs` | Retorna entries do ring buffer |

Parâmetro opcional `?limit=N` (default 200, max 500).

### 5. GUI — Console Component

**filial-gui**:
```
src/components/console.tsx
```

**matriz-gui**:
```
src/components/console.tsx
```

**Props**:
```tsx
interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}
```

**Visual**:
- Fundo preto (`bg-black`), texto verde (`text-green-400`), fonte monospace
- Scroll infinito com `overflow-y-auto`, altura `60vh`
- Auto-scroll pra baixo quando chega conteúdo novo (pausa se usuário scrollou pra cima)
- Error level: texto vermelho (`text-red-400`)
- Timestamp formatado como `HH:mm:ss`
- Botão "Limpar" no canto superior direito

**LogEntry type**:
```ts
interface LogEntry {
  level: "info" | "error";
  message: string;
  ts: number;
}
```

### 6. GUI — Hook Integration

**useFilial.ts**:
- Novo estado `logs: LogEntry[]` (máx 500)
- `ws.onmessage`: case `msg.type === "log"` → append ao estado
- `ws.onopen`: fetch `GET /api/logs` para backlog inicial
- Expõe `logs` e `clearLogs()`

**useIoT.ts**:
- Mesma lógica

**Layout / App**:
- Nova tab "Console" no `TabsList`
- Roteamento: `activeTab === "console"` → `<Console>`

---

## Files Modified

### New files:
| File | Purpose |
|------|---------|
| `packages/udp-shared/src/shared/LogCapture.java` | Ring buffer + PrintStream tee |
| `applications/filial-esp32/src/LogCapture.h` | ESP32 log capture header |
| `applications/filial-esp32/src/LogCapture.cpp` | ESP32 log capture impl |
| `applications/filial-gui/src/components/console.tsx` | Console viewer component |
| `applications/matriz-gui/src/components/console.tsx` | Console viewer component |

### Modified files:
| File | Change |
|------|--------|
| `filial-java/.../FilialMain.java` | Instala LogCapture, registra listener |
| `matriz-java/.../MatrizMain.java` | Instala LogCapture, registra listener |
| `filial-java/.../DeviceBridge.java` | N/A — `broadcast(json)` reusado |
| `matriz-java/.../BridgeManager.java` | N/A — `broadcast(json)` reusado |
| `filial-java/.../ApiHandler.java` | Rota `GET /api/logs` |
| `matriz-java/.../ApiHandler.java` | Rota `GET /api/logs` |
| `filial-esp32/src/DeviceBridge.h/.cpp` | N/A — `broadcast(json)` reusado |
| `filial-esp32/src/ApiServer.h/.cpp` | Rota `GET /api/logs` |
| `matriz-esp32/src/ApiServer.h/.cpp` | Rota `GET /api/logs` |
| `filial-esp32/src/main.cpp` | Instala LogCapture |
| `matriz-esp32/src/main.cpp` (se existir) | Instala LogCapture |
| `filial-gui/src/hooks/useFilial.ts` | Estados de log, backlog fetch |
| `filial-gui/src/App.tsx` | Roteamento da tab Console |
| `filial-gui/src/components/layout.tsx` | Tab trigger Console |
| `matriz-gui/src/hooks/useIoT.ts` | Estados de log, backlog fetch |
| `matriz-gui/src/App.tsx` | Roteamento da tab Console |
| `matriz-gui/src/components/layout.tsx` | Tab trigger Console |

---

## Edge Cases

- **Backlog vazio**: `/api/logs` retorna array vazio `[]`
- **Conexão cai e reconecta**: Ao reconectar, faz novo fetch do backlog + recomeça WS push
- **Memory overflow**: Ring buffer descarta entradas mais antigas; GUI descarta no frontend também (máx 500)
- **ESP32 resources**: Ring buffer de 500 strings consome ~10-20KB HEAP (cada string ~20-40 chars). Aceitável para ESP32.
- **Matriz Node.js backend**: O `server/index.ts` do matriz-gui não tem logs de servidor Java/ESP32 — ele é o servidor. Se quiser capturar os logs dele também, seria outro escopo.
