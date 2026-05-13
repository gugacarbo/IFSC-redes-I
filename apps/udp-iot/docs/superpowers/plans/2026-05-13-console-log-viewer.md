# Console Log Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Console tab to both GUIs that mirrors stdout (Java) / Serial (ESP32) via ring buffer + WebSocket push.

**Architecture:** Each server gets a `LogCapture` that (a) captures print output into a ring buffer (500 entries), (b) broadcasts new entries via the existing WS as `{"type":"log","level":"info|error","message":"...","ts":123}`, (c) exposes `GET /api/logs` for backlog fetch. GUIs fetch backlog on WS connect and receive live updates via push.

**Tech Stack:** Java (no framework), C++ (ESP32 Arduino), React 19 + TypeScript, ESPAsyncWebServer

---

### Task 1: LogCapture.java — shared ring buffer + PrintStream tee

**Files:**
- Create: `packages/udp-shared/src/shared/LogCapture.java`

- [ ] **Step 1: Create `LogCapture.java`**

```java
package shared;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

public class LogCapture {

    private final ConcurrentLinkedDeque<LogEntry> entries;
    private final int maxEntries;
    private Consumer<String> broadcastListener;
    private final AtomicBoolean inCapture = new AtomicBoolean(false);
    private PrintStream originalOut;
    private PrintStream originalErr;

    public static class LogEntry {
        public final String level;
        public final String message;
        public final long ts;
        public LogEntry(String level, String message) {
            this.level = level;
            this.message = message;
            this.ts = System.currentTimeMillis();
        }
    }

    public LogCapture(int maxEntries) {
        this.maxEntries = maxEntries;
        this.entries = new ConcurrentLinkedDeque<>();
    }

    public void install() {
        originalOut = System.out;
        originalErr = System.err;
        System.setOut(new LogPrintStream(originalOut, "info"));
        System.setErr(new LogPrintStream(originalErr, "error"));
    }

    public void uninstall() {
        if (originalOut != null) System.setOut(originalOut);
        if (originalErr != null) System.setErr(originalErr);
    }

    public void setBroadcastListener(Consumer<String> listener) {
        this.broadcastListener = listener;
    }

    /** Return most recent entries, oldest first, up to limit. */
    public List<LogEntry> getEntries(int limit) {
        List<LogEntry> result = new ArrayList<>();
        for (LogEntry e : entries) {
            result.add(e);
            if (result.size() >= limit) break;
        }
        return result;
    }

    public void clear() {
        entries.clear();
    }

    private void addEntry(String level, String message) {
        if (inCapture.get()) return;
        inCapture.set(true);
        try {
            LogEntry entry = new LogEntry(level, message);
            entries.addLast(entry);
            while (entries.size() > maxEntries) entries.pollFirst();
            if (broadcastListener != null) {
                broadcastListener.accept(
                    "{\"type\":\"log\",\"level\":\"" + level
                        + "\",\"message\":" + Json.escape(message)
                        + ",\"ts\":" + entry.ts + "}"
                );
            }
        } finally {
            inCapture.set(false);
        }
    }

    private class LogPrintStream extends PrintStream {
        private final String level;
        LogPrintStream(PrintStream original, String level) {
            super(original);
            this.level = level;
        }
        @Override public void println(String x) { super.println(x); addEntry(level, x); }
        @Override public void println(Object x) { super.println(x); addEntry(level, String.valueOf(x)); }
        @Override public void println() { super.println(); addEntry(level, ""); }
    }
}
```

- [ ] **Step 2: Verify compilation**

```
cd apps/udp-iot/packages/udp-shared
javac -d dist -cp src src/shared/LogCapture.java
echo $?  # expected: 0
```

- [ ] **Step 3: Commit**

```
git add apps/udp-iot/packages/udp-shared/src/shared/LogCapture.java
git commit -m "feat(udp-shared): add LogCapture with ring buffer and PrintStream tee"
```

---

### Task 2: Wire LogCapture into filial-java

**Files:**
- Modify: `applications/filial-java/src/filial/FilialMain.java` (2 insertions)
- Modify: `applications/filial-java/src/filial/ApiHandler.java` (add route + helper)

- [ ] **Step 1: Add LogCapture to FilialMain**

In `FilialMain.java`, add import and install LogCapture after config print, then register WS listener after creating DeviceBridge:

After line 29 (`System.out.println("=== Filial IoT (Java) ===");`), add:
```java
// === Log stdout to GUI console ===
LogCapture logCapture = new LogCapture(500);
logCapture.install();
```

After line 52 (`DeviceBridge deviceBridge = new DeviceBridge(devMgr, cfgMgr);`), add:
```java
logCapture.setBroadcastListener(json -> deviceBridge.broadcast(json));
```

Add import at top:
```java
import shared.LogCapture;
```

- [ ] **Step 2: Add GET /api/logs to filial ApiHandler**

In `ApiHandler.java`, add `LogCapture` field and modify constructor:

After line 26 (`private final DeviceBridge deviceBridge;`), add:
```java
private final LogCapture logCapture;
```

Modify constructor (line 29–32):
```java
public ApiHandler(DeviceManager deviceManager, DeviceBridge deviceBridge, LogCapture logCapture) {
    this.deviceManager = deviceManager;
    this.deviceBridge = deviceBridge;
    this.logCapture = logCapture;
}
```

Add route in `handle()` method, after the health block (after line 70):
```java
if (path.equals("/api/logs")) {
    if ("GET".equals(method) || "OPTIONS".equals(method)) {
        lastStatusCode.set(200);
        return logsToJson(logCapture.getEntries(200));
    }
    return jsonError(405, "Method not allowed");
}
```

Add helper method:
```java
private String logsToJson(java.util.List<LogCapture.LogEntry> logEntries) {
    StringBuilder sb = new StringBuilder("[");
    boolean first = true;
    for (LogCapture.LogEntry e : logEntries) {
        if (!first) sb.append(",");
        first = false;
        sb.append("{\"level\":\"").append(e.level)
          .append("\",\"message\":").append(Json.escape(e.message))
          .append(",\"ts\":").append(e.ts).append("}");
    }
    sb.append("]");
    return sb.toString();
}
```

Update `FilialMain.java` line 53 to pass `logCapture`:
```java
ApiHandler apiHandler = new ApiHandler(devMgr, deviceBridge, logCapture);
```

Add import in `ApiHandler.java`:
```java
import shared.LogCapture;
```

- [ ] **Step 3: Verify compilation**

```
cd apps/udp-iot/applications/filial-java
javac -d dist -cp dist:src:../../packages/udp-shared/dist src/filial/*.java
echo $?  # expected: 0
```

- [ ] **Step 4: Quick smoke test**

In one terminal:
```
cd apps/udp-iot/applications/filial-java
java -cp dist:../../packages/udp-shared/dist filial.FilialMain
```

In another:
```bash
curl http://localhost:8082/api/logs
# expected: JSON array with startup log entries
```

Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```
git add apps/udp-iot/applications/filial-java/src/filial/FilialMain.java apps/udp-iot/applications/filial-java/src/filial/ApiHandler.java
git commit -m "feat(filial-java): wire LogCapture into FilialMain and add /api/logs route"
```

---

### Task 3: Wire LogCapture into matriz-java

**Files:**
- Modify: `applications/matriz-java/src/matriz/MatrizMain.java`
- Modify: `applications/matriz-java/src/matriz/ApiHandler.java`

- [ ] **Step 1: Add LogCapture to MatrizMain**

Same pattern as filial. After line 43 (`System.out.println("=== Matriz IoT (Java) ===");`), add:
```java
// === Log stdout to GUI console ===
LogCapture logCapture = new LogCapture(500);
logCapture.install();
```

After line 60 (`BridgeManager bridgeManager = new BridgeManager(configManager, udpClient);`), add:
```java
logCapture.setBroadcastListener(json -> bridgeManager.broadcast(json));
```

Add import:
```java
import shared.LogCapture;
```

- [ ] **Step 2: Add GET /api/logs to matriz ApiHandler**

`ApiHandler.java` — add `LogCapture` field and constructor param:

After line 20 (`private final FilialStateTracker stateTracker;`), add:
```java
private final LogCapture logCapture;
```

Modify constructor (line 23–26):
```java
public ApiHandler(ConfigManager configManager, FilialStateTracker stateTracker, LogCapture logCapture) {
    this.configManager = configManager;
    this.stateTracker = stateTracker;
    this.logCapture = logCapture;
}
```

Add route in `handle()` switch, after `case "/health"`:
```java
case "/api/logs" -> handleLogs(method);
```

Add handler method:
```java
private String handleLogs(String method) {
    if ("GET".equals(method) || "OPTIONS".equals(method)) {
        lastStatusCode = 200;
        return logsToJson(logCapture.getEntries(200));
    }
    lastStatusCode = 405;
    return jsonError(405, "Method not allowed");
}
```

Add helper:
```java
private String logsToJson(java.util.List<LogCapture.LogEntry> logEntries) {
    StringBuilder sb = new StringBuilder("[");
    boolean first = true;
    for (LogCapture.LogEntry e : logEntries) {
        if (!first) sb.append(",");
        first = false;
        sb.append("{\"level\":\"").append(e.level)
          .append("\",\"message\":").append(Json.escape(e.message))
          .append(",\"ts\":").append(e.ts).append("}");
    }
    sb.append("]");
    return sb.toString();
}
```

Update `MatrizMain.java` (where ApiHandler is constructed) to pass `logCapture`:
```java
ApiHandler apiHandler = new ApiHandler(configManager, stateTracker, logCapture);
```

Add import in `ApiHandler.java`:
```java
import shared.LogCapture;
```

- [ ] **Step 3: Verify compilation**

```
cd apps/udp-iot/applications/matriz-java
javac -d dist -cp dist:src:../../packages/udp-shared/dist src/matriz/*.java
echo $?  # expected: 0
```

- [ ] **Step 4: Commit**

```
git add apps/udp-iot/applications/matriz-java/src/matriz/MatrizMain.java apps/udp-iot/applications/matriz-java/src/matriz/ApiHandler.java
git commit -m "feat(matriz-java): wire LogCapture into MatrizMain and add /api/logs route"
```

---

### Task 4: LogCapture + integration for filial-esp32

**Files:**
- Create: `applications/filial-esp32/src/LogCapture.h`
- Create: `applications/filial-esp32/src/LogCapture.cpp`
- Modify: `applications/filial-esp32/src/main.cpp`
- Modify: `applications/filial-esp32/src/ApiServer.h`
- Modify: `applications/filial-esp32/src/ApiServer.cpp`
- Modify: `applications/filial-esp32/src/DeviceBridge.h`
- Modify: `applications/filial-esp32/src/DeviceBridge.cpp`

- [ ] **Step 1: Create `LogCapture.h`**

```cpp
#ifndef LOG_CAPTURE_H
#define LOG_CAPTURE_H

#include <Arduino.h>

class LogCapture {
public:
    static void begin(size_t maxEntries = 500);
    static void println(const char* message, const char* level = "info");
    static void error(const char* message);
    static void printf(const char* fmt, ...);
    static String getEntries(int limit);
    static void clear();
    static void setBroadcastCallback(void (*cb)(const char* json));

private:
    static String* entries;
    static String* levels;
    static unsigned long* timestamps;
    static size_t max;
    static size_t head;
    static size_t count;
    static void (*broadcastCb)(const char*);
    static bool inCapture;
    static void addEntry(const char* level, const char* message);
};

#endif
```

- [ ] **Step 2: Create `LogCapture.cpp`**

```cpp
#include "LogCapture.h"
#include <stdarg.h>

String* LogCapture::entries = nullptr;
String* LogCapture::levels = nullptr;
unsigned long* LogCapture::timestamps = nullptr;
size_t LogCapture::max = 500;
size_t LogCapture::head = 0;
size_t LogCapture::count = 0;
void (*LogCapture::broadcastCb)(const char*) = nullptr;
bool LogCapture::inCapture = false;

void LogCapture::begin(size_t maxEntries) {
    max = maxEntries;
    entries = new String[max];
    levels = new String[max];
    timestamps = new unsigned long[max];
    head = 0;
    count = 0;
}

void LogCapture::addEntry(const char* level, const char* message) {
    if (inCapture) return;
    inCapture = true;

    entries[head] = String(message);
    levels[head] = String(level);
    timestamps[head] = millis();
    head = (head + 1) % max;
    if (count < max) count++;

    if (broadcastCb) {
        String json = "{\"type\":\"log\",\"level\":\"";
        json += level;
        json += "\",\"message\":\"";
        // Escape JSON special chars
        for (const char* p = message; *p; p++) {
            if (*p == '"') json += "\\\"";
            else if (*p == '\\') json += "\\\\";
            else if (*p == '\n') json += "\\n";
            else if (*p == '\r') json += "\\r";
            else if (*p == '\t') json += "\\t";
            else json += *p;
        }
        json += "\",\"ts\":";
        json += String(timestamps[(head - 1 + max) % max]);
        json += "}";
        broadcastCb(json.c_str());
    }

    inCapture = false;
}

void LogCapture::println(const char* message, const char* level) {
    Serial.println(message);
    addEntry(level, message);
}

void LogCapture::error(const char* message) {
    Serial.println(message);
    addEntry("error", message);
}

void LogCapture::printf(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    char buf[256];
    vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);
    Serial.print(buf);
    addEntry("info", buf);
}

String LogCapture::getEntries(int limit) {
    String result = "[";
    bool first = true;
    size_t start = (count < max) ? 0 : head;
    size_t total = (count < max) ? count : max;
    size_t limit_count = (limit > 0 && (size_t)limit < total) ? limit : total;

    for (size_t i = 0; i < limit_count; i++) {
        size_t idx = (start + total - 1 - i) % max; // newest first
        if (!first) result += ",";
        first = false;
        result += "{\"level\":\"";
        result += levels[idx];
        result += "\",\"message\":\"";
        // Escape message
        const String& msg = entries[idx];
        for (size_t c = 0; c < msg.length(); c++) {
            char ch = msg.charAt(c);
            if (ch == '"') result += "\\\"";
            else if (ch == '\\') result += "\\\\";
            else if (ch == '\n') result += "\\n";
            else if (ch == '\r') result += "\\r";
            else if (ch == '\t') result += "\\t";
            else result += ch;
        }
        result += "\",\"ts\":";
        result += String(timestamps[idx]);
        result += "}";
    }
    result += "]";
    return result;
}

void LogCapture::clear() {
    head = 0;
    count = 0;
}

void LogCapture::setBroadcastCallback(void (*cb)(const char*)) {
    broadcastCb = cb;
}
```

- [ ] **Step 3: Add `broadcast` method to DeviceBridge for log forwarding**

In `DeviceBridge.h`, add after `broadcastDevicesUpdated()`:
```cpp
void broadcast(const char* json);
```

In `DeviceBridge.cpp`, add implementation:
```cpp
void DeviceBridge::broadcast(const char* json) {
    ws.textAll(json);
}
```

- [ ] **Step 4: Add GET /api/logs route to filial-esp32 ApiServer**

In `ApiServer.h`, add after `begin()`:
```cpp
static String getLogsJson();
```

In `ApiServer.cpp`, add route in `setupRoutes()`, after the health check block:
```cpp
// ── GET /api/logs ──
server.on("/api/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
    int limit = 200;
    if (request->hasParam("limit")) {
        limit = request->getParam("limit")->value().toInt();
    }
    String json = LogCapture::getEntries(limit);
    AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
    resp->addHeader("Access-Control-Allow-Origin", "*");
    request->send(resp);
});

server.on("/api/logs", HTTP_OPTIONS, cors);
```

Add include in `ApiServer.cpp`:
```cpp
#include "LogCapture.h"
```

- [ ] **Step 5: Wire LogCapture into filial-esp32 main.cpp**

In `main.cpp`, after `Serial.begin(115200);` add:
```cpp
LogCapture::begin(500);
LogCapture::println("Filial IoT (ESP32) starting...");
```

After `deviceBridge.begin(apiServer->getServer(), &deviceManager);` add:
```cpp
LogCapture::setBroadcastCallback([](const char* json) {
    deviceBridge.broadcast(json);
});
```

Add include at top:
```cpp
#include "LogCapture.h"
```

Update `Serial.print/println` calls to use `LogCapture::println/printf` for key messages. Change these lines in `main.cpp`:

Line 19: `Serial.printf("Connecting to %s ", WIFI_SSID);` → `Serial.printf("Connecting to %s ", WIFI_SSID);` (keep Serial for wifi dots, but after connection):
```cpp
// After line 27 (Serial.println(WiFi.localIP());), replace the 2 lines:
// Remove: Serial.print("Filial ready. UDP port: ");
// Remove: Serial.print(globalConfig.port);
// Remove: Serial.print(", HTTP/WS port: ");
// Remove: Serial.println(httpPort);
// Replace with:
LogCapture::printf("Filial ready. UDP port: %d, HTTP/WS port: %d", globalConfig.port, httpPort);
```

And change the `Serial.println(" CONNECTED");` on line 25 to:
```cpp
LogCapture::println("WiFi connected");
```

And change line 51-53 remove `Serial.print` and replace with:
```cpp
LogCapture::printf("Filial ready. UDP port: %d, HTTP/WS port: %d", globalConfig.port, httpPort);
```

- [ ] **Step 6: Verify with PlatformIO**

```
cd apps/udp-iot/applications/filial-esp32
pio run
echo $?  # expected: 0
```

- [ ] **Step 7: Commit**

```
git add apps/udp-iot/applications/filial-esp32/src/
git commit -m "feat(filial-esp32): add LogCapture with ring buffer and WS broadcast"
```

---

### Task 5: LogCapture + integration for matriz-esp32

**Files:**
- Create: `applications/matriz-esp32/src/LogCapture.h` (same content as filial-esp32)
- Create: `applications/matriz-esp32/src/LogCapture.cpp` (same content as filial-esp32)
- Modify: `applications/matriz-esp32/src/main.cpp`
- Modify: `applications/matriz-esp32/src/ApiServer.h`
- Modify: `applications/matriz-esp32/src/ApiServer.cpp`
- Modify: `applications/matriz-esp32/src/BridgeManager.h`
- Modify: `applications/matriz-esp32/src/BridgeManager.cpp`

- [ ] **Step 1: Create LogCapture.h/.cpp**

Copy `LogCapture.h` and `LogCapture.cpp` from filial-esp32 to matriz-esp32. Same content.

- [ ] **Step 2: Add `broadcast` method to BridgeManager**

In `BridgeManager.h`, add after `sendUdpCommand()`:
```cpp
void broadcast(const char* json);
```

In `BridgeManager.cpp`, add implementation:
```cpp
void BridgeManager::broadcast(const char* json) {
    ws.textAll(json);
}
```

- [ ] **Step 3: Add GET /api/logs route to matriz-esp32 ApiServer**

In `ApiServer.h`, no changes needed — it's the same class structure.

In `ApiServer.cpp`, add route in `setupRoutes()`, after the config block:
```cpp
// ── GET /api/logs ──
server.on("/api/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
    int limit = 200;
    if (request->hasParam("limit")) {
        limit = request->getParam("limit")->value().toInt();
    }
    String json = LogCapture::getEntries(limit);
    AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
    resp->addHeader("Access-Control-Allow-Origin", "*");
    request->send(resp);
});

server.on("/api/logs", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    AsyncWebServerResponse *resp = request->beginResponse(200);
    resp->addHeader("Access-Control-Allow-Origin", "*");
    resp->addHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
    request->send(resp);
});
```

Add include in `ApiServer.cpp`:
```cpp
#include "LogCapture.h"
```

- [ ] **Step 4: Wire LogCapture into matriz-esp32 main.cpp**

In `main.cpp`, after `Serial.begin(115200);` add:
```cpp
LogCapture::begin(500);
LogCapture::println("Matriz IoT (ESP32) starting...");
```

After `bridge.begin(apiServer.getServer());` add:
```cpp
LogCapture::setBroadcastCallback([](const char* json) {
    bridge.broadcast(json);
});
```

Add include at top:
```cpp
#include "LogCapture.h"
```

Replace Serial prints in `connectWiFi()`:
```cpp
// Replace lines 18-19 with:
LogCapture::printf("Matriz IP: %s", WiFi.localIP().toString().c_str());
```

- [ ] **Step 5: Verify with PlatformIO**

```
cd apps/udp-iot/applications/matriz-esp32
pio run
echo $?  # expected: 0
```

- [ ] **Step 6: Commit**

```
git add apps/udp-iot/applications/matriz-esp32/src/
git commit -m "feat(matriz-esp32): add LogCapture with ring buffer and WS broadcast"
```

---

### Task 6: Console component for filial-gui

**Files:**
- Modify: `applications/filial-gui/src/types.ts`
- Modify: `applications/filial-gui/src/hooks/useFilial.ts`
- Create: `applications/filial-gui/src/components/console.tsx`
- Modify: `applications/filial-gui/src/components/layout.tsx`
- Modify: `applications/filial-gui/src/App.tsx`

- [ ] **Step 1: Add LogEntry type to types.ts**

Append to `applications/filial-gui/src/types.ts`:
```ts
export interface LogEntry {
  level: "info" | "error";
  message: string;
  ts: number;
}
```

- [ ] **Step 2: Add log state and handlers to useFilial.ts**

Add to imports:
```ts
import type { DeviceInfo, ServerConfig, LogEntry } from "../types";
```

Add state after `config` (line 13):
```ts
const [logs, setLogs] = useState<LogEntry[]>([]);
```

In the `useEffect` WebSocket setup (line 42), modify `ws.onopen`:
```ts
ws.onopen = () => {
  setConnected(true);
  // Fetch log backlog from server
  fetch(`${API_BASE}/api/logs`)
    .then((r) => r.json())
    .then((data) => setLogs(data.reverse())) // server returns newest first
    .catch(() => {});
};
```

Modify `ws.onmessage` to handle log type:
```ts
ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === "devices_updated") {
      setDevices(msg.devices);
    } else if (msg.type === "log") {
      setLogs((prev) => {
        const next = [...prev, { level: msg.level, message: msg.message, ts: msg.ts }];
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });
    }
  } catch {
    // ignore malformed messages
  }
};
```

Add return values at the end:
```ts
return {
  devices,
  connected,
  config,
  logs,
  clearLogs: () => setLogs([]),
  setDevice,
  addDevice,
  removeDevice,
  updateDevice,
  updateConfig,
};
```

- [ ] **Step 3: Create Console component**

```tsx
// applications/filial-gui/src/components/console.tsx
import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";
import { Button } from "@udp-iot/ui/components/button";

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function Console({ logs, onClear }: ConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // If user scrolled up, pause auto-scroll
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    autoScroll.current = isAtBottom;
  }, [logs]);

  useEffect(() => {
    if (autoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Console</h2>
        <Button variant="outline" size="sm" onClick={onClear}>
          Limpar
        </Button>
      </div>
      <div
        ref={containerRef}
        className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-[60vh] overflow-y-auto whitespace-pre-wrap break-all"
      >
        {logs.length === 0 && (
          <span className="text-zinc-500">Aguardando logs...</span>
        )}
        {logs.map((entry, i) => (
          <div
            key={i}
            className={entry.level === "error" ? "text-red-400" : "text-green-400"}
          >
            <span className="text-zinc-500 mr-2">
              [{new Date(entry.ts).toLocaleTimeString()}]
            </span>
            {entry.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add Console tab to layout.tsx**

Add a new `TabsTrigger` after `Configuracao`:
```tsx
<TabsTrigger value="console">Console</TabsTrigger>
```

- [ ] **Step 5: Wire Console into App.tsx**

Update imports to include Console and the new hook return values:
```tsx
import { Console } from "./components/console";
```

Update the hook destructuring:
```tsx
const { devices, connected, config, logs, clearLogs, setDevice, addDevice, removeDevice, updateDevice, updateConfig } = useFilial();
```

Add the Console route:
```tsx
{activeTab === "console" && (
  <Console logs={logs} onClear={clearLogs} />
)}
```

- [ ] **Step 6: Verify with TypeScript**

```
cd apps/udp-iot/applications/filial-gui
npx tsc -b --noEmit
echo $?  # expected: 0
```

- [ ] **Step 7: Commit**

```
git add apps/udp-iot/applications/filial-gui/src/
git commit -m "feat(filial-gui): add Console tab with live log streaming"
```

---

### Task 7: Console component for matriz-gui

**Files:**
- Modify: `applications/matriz-gui/src/types.ts`
- Modify: `applications/matriz-gui/src/hooks/useIoT.ts`
- Create: `applications/matriz-gui/src/components/console.tsx`
- Modify: `applications/matriz-gui/src/components/layout.tsx`
- Modify: `applications/matriz-gui/src/App.tsx`

- [ ] **Step 1: Add LogEntry type to types.ts**

Append:
```ts
export interface LogEntry {
  level: "info" | "error";
  message: string;
  ts: number;
}
```

- [ ] **Step 2: Add log state and handlers to useIoT.ts**

Add to imports:
```ts
import type { AppConfig, FilialData, LogEntry } from "../types";
```

Add state after `config` (line 14):
```ts
const [logs, setLogs] = useState<LogEntry[]>([]);
```

In the `connect` callback, modify `ws.onopen`:
```ts
ws.onopen = () => {
  setConnected(true);
  backoffRef.current = 1000;
  // Fetch log backlog from server
  fetch(`${API_URL}/api/logs`)
    .then((r) => r.json())
    .then((data) => setLogs(data.reverse()))
    .catch(() => {});
};
```

Add log handler in `ws.onmessage`, after the `ws_rx` block:
```ts
else if (msg.type === "log") {
  setLogs((prev) => {
    const next = [...prev, { level: msg.level, message: msg.message, ts: msg.ts }];
    return next.length > 500 ? next.slice(next.length - 500) : next;
  });
}
```

Add to return object:
```ts
return { filiais, connected, config, logs, updateConfig, sendCommand, clearLogs: () => setLogs([]) };
```

- [ ] **Step 3: Create Console component**

Same as filial-gui's `console.tsx` (identical file, save at `applications/matriz-gui/src/components/console.tsx`). Update import path if needed:
```tsx
import type { LogEntry } from "../types";
```

- [ ] **Step 4: Add Console tab to layout.tsx**

In the `TabsList`, add after the Config trigger:
```tsx
<TabsTrigger value="console">
  Console
</TabsTrigger>
```

- [ ] **Step 5: Wire Console into App.tsx**

Update imports:
```tsx
import { Console } from "./components/console";
```

Update hook destructuring:
```tsx
const { filiais, connected, logs, sendCommand, clearLogs } = useIoT();
```

Add the Console route:
```tsx
{tab === "console" ? (
  <Console logs={logs} onClear={clearLogs} />
) : tab === "dashboard" ? (
  ...
)}
```

Need to refactor the ternary in App.tsx since we now have 3 tabs. Replace:
```tsx
{tab === "dashboard" ? (
  <Dashboard filiais={filiais} onCommand={sendCommand} />
) : (
  <ConfigView />
)}
```

With:
```tsx
{tab === "dashboard" && (
  <Dashboard filiais={filiais} onCommand={sendCommand} />
)}
{tab === "config" && (
  <ConfigView />
)}
{tab === "console" && (
  <Console logs={logs} onClear={clearLogs} />
)}
```

- [ ] **Step 6: Verify with TypeScript**

```
cd apps/udp-iot/applications/matriz-gui
npx tsc -b --noEmit
echo $?  # expected: 0
```

- [ ] **Step 7: Commit**

```
git add apps/udp-iot/applications/matriz-gui/src/
git commit -m "feat(matriz-gui): add Console tab with live log streaming"
```
