# Filial ESP32 WebSocket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HTTP + WebSocket server to filial-esp32 (same pattern as filial-java and matriz-esp32).

**Architecture:** ESPAsyncWebServer on port 80 serves REST API + AsyncWebSocket at `/ws`. DeviceBridge routes WebSocket messages to local DeviceManager. UDP server remains for Matriz communication.

**Tech Stack:** C++ (Arduino framework, PlatformIO), ESPAsyncWebServer, AsyncUDP, ArduinoJson 7.

---

### Task 1: platformio.ini — add ESPAsyncWebServer dependency

**Files:**
- Modify: `applications/filial-esp32/platformio.ini`

- [ ] **Step 1: Add dependency**

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
board_build.filesystem = littlefs
lib_deps =
    bblanchon/ArduinoJson @ ^7.0.4
    mathieucarbou/ESPAsyncWebServer @ ^3.6.0
```

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/platformio.ini
git commit -m "chore(filial-esp32): add ESPAsyncWebServer dependency"
```

---

### Task 2: FilialConfig — add http_port field

**Files:**
- Modify: `applications/filial-esp32/src/ConfigManager.h`
- Modify: `applications/filial-esp32/src/ConfigManager.cpp`

- [ ] **Step 1: Add http_port to FilialConfig struct**

In `ConfigManager.h`:
```cpp
struct FilialConfig {
    uint16_t port;
    uint16_t http_port;  // novo: HTTP + WebSocket port (default 80)
    String admin_user;
    String admin_pass;
    std::vector<String> devices;
};
```

- [ ] **Step 2: Load http_port in ConfigManager::loadConfig**

Read the existing `ConfigManager.cpp` and add:
```cpp
config.http_port = doc["http_port"] | 80;
```

After the existing `config.port = ...` line.

- [ ] **Step 3: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/src/ConfigManager.h apps/udp-iot/applications/filial-esp32/src/ConfigManager.cpp
git commit -m "feat(filial-esp32): add http_port to FilialConfig"
```

---

### Task 3: DeviceManager — add addDevice, removeDevice, getAllJson methods

**Files:**
- Modify: `applications/filial-esp32/src/DeviceManager.h`
- Modify: `applications/filial-esp32/src/DeviceManager.cpp`

- [ ] **Step 1: Add method declarations to DeviceManager.h**

```cpp
class DeviceManager {
private:
    std::map<String, DeviceState> devices;
public:
    void init(const std::vector<String>& device_ids);
    bool get(const String& id, DeviceState& out_state);
    bool set(const String& id, bool val);
    bool set(const String& id, int val);
    std::vector<String> list();

    // new methods
    bool addDevice(const String& id);
    bool removeDevice(const String& id);
    String getAllJson();  // returns JSON array of all devices
};
```

- [ ] **Step 2: Implement in DeviceManager.cpp**

```cpp
bool DeviceManager::addDevice(const String& id) {
    if (devices.find(id) != devices.end()) return false;
    DeviceState state;
    state.is_light = id.indexOf("_light_") != -1;
    state.bool_val = false;
    state.int_val = 0;
    devices[id] = state;
    return true;
}

bool DeviceManager::removeDevice(const String& id) {
    return devices.erase(id) > 0;
}

String DeviceManager::getAllJson() {
    String json = "[";
    bool first = true;
    for (auto const& pair : devices) {
        if (!first) json += ",";
        first = false;
        json += "{";
        json += "\"id\":\"" + pair.first + "\",";
        json += "\"isLight\":" + String(pair.second.is_light ? "true" : "false") + ",";
        bool isSensor = pair.first.indexOf("sensor_") == 0;
        json += "\"isSensor\":" + String(isSensor ? "true" : "false") + ",";
        json += "\"boolValue\":" + String(pair.second.bool_val ? "true" : "false") + ",";
        json += "\"intValue\":" + String(pair.second.int_val);
        json += "}";
    }
    json += "]";
    return json;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/src/DeviceManager.h apps/udp-iot/applications/filial-esp32/src/DeviceManager.cpp
git commit -m "feat(filial-esp32): add addDevice/removeDevice/getAllJson to DeviceManager"
```

---

### Task 4: DeviceBridge (.h + .cpp) — WebSocket handler

**Files:**
- Create: `applications/filial-esp32/src/DeviceBridge.h`
- Create: `applications/filial-esp32/src/DeviceBridge.cpp`

- [ ] **Step 1: Create DeviceBridge.h**

```cpp
#ifndef DEVICE_BRIDGE_H
#define DEVICE_BRIDGE_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include "DeviceManager.h"

class DeviceBridge {
private:
    AsyncWebSocket ws;
    DeviceManager* devMgr;
    void handleWsMessage(void* arg, uint8_t* data, size_t len);
public:
    DeviceBridge() : ws("/ws") {}
    void begin(AsyncWebServer& server, DeviceManager* mgr);
    void broadcastDevicesUpdated();
};

#endif
```

- [ ] **Step 2: Create DeviceBridge.cpp**

```cpp
#include "DeviceBridge.h"
#include <ArduinoJson.h>

void DeviceBridge::begin(AsyncWebServer& server, DeviceManager* mgr) {
    devMgr = mgr;

    ws.onEvent([this](AsyncWebSocket* srv, AsyncWebSocketClient* client,
                      AwsEventType type, void* arg, uint8_t* data, size_t len) {
        if (type == WS_EVT_DATA) {
            AwsFrameInfo* info = (AwsFrameInfo*)arg;
            if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
                this->handleWsMessage(arg, data, len);
            }
        }
    });

    server.addHandler(&ws);
}

void DeviceBridge::handleWsMessage(void* arg, uint8_t* data, size_t len) {
    String msg;
    msg.concat((const char*)data, len);

    JsonDocument doc;
    if (deserializeJson(doc, msg)) return;

    String type = doc["type"] | "";

    if (type == "set_device") {
        String id = doc["id"] | "";
        if (id.isEmpty()) return;

        DeviceState state;
        if (!devMgr->get(id, state)) return;

        // sensor = read-only
        if (id.indexOf("sensor_") == 0) return;

        if (state.is_light) {
            devMgr->set(id, doc["value"].as<bool>());
        } else {
            devMgr->set(id, doc["value"].as<int>());
        }
        broadcastDevicesUpdated();
    }
    else if (type == "add_device") {
        String id = doc["id"] | "";
        if (id.isEmpty()) return;
        if (devMgr->addDevice(id)) {
            broadcastDevicesUpdated();
        }
    }
    else if (type == "remove_device") {
        String id = doc["id"] | "";
        if (id.isEmpty()) return;
        if (devMgr->removeDevice(id)) {
            broadcastDevicesUpdated();
        }
    }
}

void DeviceBridge::broadcastDevicesUpdated() {
    String json = "{\"type\":\"devices_updated\",\"devices\":";
    json += devMgr->getAllJson();
    json += "}";
    ws.textAll(json);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/src/DeviceBridge.h apps/udp-iot/applications/filial-esp32/src/DeviceBridge.cpp
git commit -m "feat(filial-esp32): add DeviceBridge for WebSocket + broadcast"
```

---

### Task 5: ApiServer (.h + .cpp) — REST API routes

**Files:**
- Create: `applications/filial-esp32/src/ApiServer.h`
- Create: `applications/filial-esp32/src/ApiServer.cpp`

- [ ] **Step 1: Create ApiServer.h**

```cpp
#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include "DeviceManager.h"

class ApiServer {
private:
    AsyncWebServer server;
    DeviceManager* devMgr;
    void setupRoutes();
public:
    ApiServer(uint16_t port) : server(port) {}
    void begin(DeviceManager* mgr);
    AsyncWebServer& getServer() { return server; }
};

#endif
```

- [ ] **Step 2: Create ApiServer.cpp**

```cpp
#include "ApiServer.h"
#include <LittleFS.h>

void ApiServer::setupRoutes() {
    // ── CORS preflight ──
    auto cors = [](AsyncWebServerRequest *request) {
        AsyncWebServerResponse *resp = request->beginResponse(204);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
        request->send(resp);
    };

    server.on("/api/devices", HTTP_OPTIONS, cors);
    server.on("/api/config",  HTTP_OPTIONS, cors);
    server.on("/health",      HTTP_OPTIONS, cors);

    // ── GET /api/devices ──
    server.on("/api/devices", HTTP_GET, [this](AsyncWebServerRequest *request) {
        String json = devMgr->getAllJson();
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });

    // ── POST /api/devices (add) ──
    server.on("/api/devices", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [this](AsyncWebServerRequest *request, uint8_t *data, size_t len,
               size_t index, size_t total) {
            String body;
            body.reserve(len);
            for (size_t i = 0; i < len; i++) body += (char)data[i];

            JsonDocument doc;
            if (deserializeJson(doc, body)) {
                AsyncWebServerResponse *resp = request->beginResponse(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                resp->addHeader("Access-Control-Allow-Origin", "*");
                request->send(resp);
                return;
            }

            String id = doc["id"] | "";
            if (id.isEmpty()) {
                AsyncWebServerResponse *resp = request->beginResponse(400, "application/json", "{\"error\":\"Missing id\"}");
                resp->addHeader("Access-Control-Allow-Origin", "*");
                request->send(resp);
                return;
            }

            devMgr->addDevice(id);

            String json = "{\"id\":\"" + id + "\"}";
            AsyncWebServerResponse *resp = request->beginResponse(201, "application/json", json);
            resp->addHeader("Access-Control-Allow-Origin", "*");
            request->send(resp);
        }
    );

    // ── DELETE /api/devices/<id> ──
    server.on([](const String& uri) { return uri.startsWith("/api/devices/") && uri != "/api/devices"; },
        HTTP_DELETE,
        [this](AsyncWebServerRequest *request) {
            String id = request->url().substring(strlen("/api/devices/"));
            bool removed = devMgr->removeDevice(id);

            if (!removed) {
                AsyncWebServerResponse *resp = request->beginResponse(404, "application/json", "{\"error\":\"Device not found\"}");
                resp->addHeader("Access-Control-Allow-Origin", "*");
                request->send(resp);
                return;
            }

            String json = "{\"id\":\"" + id + "\",\"removed\":true}";
            AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
            resp->addHeader("Access-Control-Allow-Origin", "*");
            request->send(resp);
        }
    );

    // ── GET /api/config ──
    server.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request) {
        // Simplified config response
        String json = "{\"port\":0,\"adminUser\":\"admin\",\"adminPass\":\"admin\",\"deviceCount\":0}";
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });

    // ── GET /health ──
    server.on("/health", HTTP_GET, [this](AsyncWebServerRequest *request) {
        String json = "{\"status\":\"ok\",\"devices\":" + String(devMgr->list().size()) + "}";
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
}

void ApiServer::begin(DeviceManager* mgr) {
    devMgr = mgr;
    setupRoutes();
    server.begin();
    Serial.println("ApiServer: HTTP + WebSocket started on port " + String(server.port()));
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/src/ApiServer.h apps/udp-iot/applications/filial-esp32/src/ApiServer.cpp
git commit -m "feat(filial-esp32): add ApiServer with REST API routes"
```

---

### Task 6: main.cpp — wire everything together

**Files:**
- Modify: `applications/filial-esp32/src/main.cpp`

- [ ] **Step 1: Update main.cpp**

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "DeviceManager.h"
#include "UdpServer.h"
#include "DeviceBridge.h"
#include "ApiServer.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

FilialConfig globalConfig;
DeviceManager deviceManager;
UdpServerWrapper udpServer;
DeviceBridge deviceBridge;
ApiServer* apiServer = nullptr;

void connectWiFi() {
    Serial.printf("Connecting to %s ", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" CONNECTED");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

void setup() {
    Serial.begin(115200);

    if (ConfigManager::begin()) {
        if (ConfigManager::loadConfig(globalConfig)) {
            deviceManager.init(globalConfig.devices);
        }
    }

    connectWiFi();

    // Start UDP (Matriz communication)
    udpServer.begin(&globalConfig, &deviceManager);

    // Start HTTP + WebSocket (GUI communication)
    uint16_t httpPort = globalConfig.http_port > 0 ? globalConfig.http_port : 80;
    apiServer = new ApiServer(httpPort);
    deviceBridge.begin(apiServer->getServer(), &deviceManager);
    apiServer->begin(&deviceManager);

    Serial.print("Filial ready. UDP port: ");
    Serial.print(globalConfig.port);
    Serial.print(", HTTP/WS port: ");
    Serial.println(httpPort);
}

void loop() {
    delay(1000);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/src/main.cpp
git commit -m "feat(filial-esp32): wire DeviceBridge + ApiServer into main"
```

---

### Task 7: config file — add http_port

**Files:**
- Modify: `applications/filial-esp32/data/config_filial.json`

- [ ] **Step 1: Read existing config file and add http_port**

```json
{
  "port": 51000,
  "http_port": 80,
  "admin_user": "admin",
  "admin_pass": "admin",
  "id": [
    "actuator_light_sala",
    "sensor_light_sala",
    "actuator_ac_escritorio",
    "sensor_ac_escritorio"
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-esp32/data/config_filial.json
git commit -m "chore(filial-esp32): add http_port to config"
```

---

### Task 8: Verify compilation

- [ ] **Step 1: Build with PlatformIO**

```bash
cd apps/udp-iot/applications/filial-esp32 && pio run
```

Expected: compiles without errors.

If errors occur, fix them and recompile. Then commit fixes:
```bash
git add -A
git commit -m "fix: compilation fixes"
```
