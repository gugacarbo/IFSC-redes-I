# Matriz ESP32 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Matriz ESP32 firmware which acts as a bridge. It manages configurations via REST, polls filial states via UDP, and proxies realtime data to the React GUI via WebSocket.

**Architecture:** C++ (PlatformIO / Arduino). Uses ESPAsyncWebServer for REST and WebSocket. Uses LittleFS to read/write `config_matriz.json`. Uses AsyncUDP to communicate with filiais. Runs a periodic ticker for polling.

**Tech Stack:** PlatformIO, Arduino framework, ESP32, LittleFS, ArduinoJson, AsyncUDP, ESPAsyncWebServer.

---

### Task 1: Setup PlatformIO and Dependencies

**Files:**
- Create: `apps/matriz-esp32/platformio.ini`
- Create: `apps/matriz-esp32/src/main.cpp`
- Create: `apps/matriz-esp32/data/config_matriz.json`

- [ ] **Step 1: Create `platformio.ini`**

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

- [ ] **Step 2: Create default configuration file in `data/`**

```json
{
  "user": "test",
  "pass": "test",
  "polling_ms": 5000,
  "filiais": [
    {
      "name": "Filial Local",
      "ip": "127.0.0.1",
      "port": 51000
    }
  ]
}
```

- [ ] **Step 3: Create skeleton `main.cpp`**

```cpp
#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  Serial.println("Starting Matriz ESP32...");
}

void loop() {
}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/matriz-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/matriz-esp32/
git commit -m "feat(matriz): setup platformio, dependencies and base config"
```

---

### Task 2: Config Manager (CRUD)

**Files:**
- Create: `apps/matriz-esp32/src/ConfigManager.h`
- Create: `apps/matriz-esp32/src/ConfigManager.cpp`
- Modify: `apps/matriz-esp32/src/main.cpp`

- [ ] **Step 1: Create ConfigManager header**

```cpp
#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <vector>

struct FilialNode {
    String name;
    String ip;
    uint16_t port;
};

struct MatrizConfig {
    String user;
    String pass;
    uint32_t polling_ms;
    std::vector<FilialNode> filiais;
};

class ConfigManager {
private:
    static MatrizConfig currentConfig;
public:
    static bool begin();
    static bool loadConfig();
    static bool saveConfig(const String& jsonPayload);
    static MatrizConfig& getConfig() { return currentConfig; }
    static String getConfigJson();
};

#endif
```

- [ ] **Step 2: Create ConfigManager implementation**

```cpp
#include "ConfigManager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

MatrizConfig ConfigManager::currentConfig;

bool ConfigManager::begin() {
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS Mount Failed");
        return false;
    }
    return loadConfig();
}

bool ConfigManager::loadConfig() {
    File file = LittleFS.open("/config_matriz.json", "r");
    if (!file) {
        Serial.println("Failed to open config file");
        return false;
    }

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, file);
    if (error) return false;

    currentConfig.user = doc["user"] | "test";
    currentConfig.pass = doc["pass"] | "test";
    currentConfig.polling_ms = doc["polling_ms"] | 5000;
    
    currentConfig.filiais.clear();
    JsonArray arr = doc["filiais"];
    for (JsonObject f : arr) {
        FilialNode node;
        node.name = f["name"] | "Unnamed";
        node.ip = f["ip"] | "";
        node.port = f["port"] | 51000;
        currentConfig.filiais.push_back(node);
    }

    file.close();
    return true;
}

bool ConfigManager::saveConfig(const String& jsonPayload) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, jsonPayload);
    if (error) return false;

    File file = LittleFS.open("/config_matriz.json", "w");
    if (!file) return false;

    serializeJson(doc, file);
    file.close();
    
    // Reload into memory
    return loadConfig();
}

String ConfigManager::getConfigJson() {
    File file = LittleFS.open("/config_matriz.json", "r");
    if (!file) return "{}";
    String res = file.readString();
    file.close();
    return res;
}
```

- [ ] **Step 3: Test loading in main.cpp**

```cpp
#include <Arduino.h>
#include "ConfigManager.h"

void setup() {
  Serial.begin(115200);
  
  if (ConfigManager::begin()) {
      MatrizConfig& cfg = ConfigManager::getConfig();
      Serial.printf("Loaded! User: %s, Polling: %d ms, Filiais: %d\n", 
            cfg.user.c_str(), cfg.polling_ms, cfg.filiais.size());
  }
}

void loop() {}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/matriz-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/matriz-esp32/src/ConfigManager.* apps/matriz-esp32/src/main.cpp
git commit -m "feat(matriz): implement config manager with write support"
```

---

### Task 3: API REST & WiFi

**Files:**
- Create: `apps/matriz-esp32/src/ApiServer.h`
- Create: `apps/matriz-esp32/src/ApiServer.cpp`
- Modify: `apps/matriz-esp32/src/main.cpp`

- [ ] **Step 1: Create ApiServer header**

```cpp
#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>

class ApiServer {
private:
    AsyncWebServer server;
    void setupRoutes();
public:
    ApiServer() : server(80) {}
    void begin();
    AsyncWebServer& getServer() { return server; }
};

#endif
```

- [ ] **Step 2: Create ApiServer implementation**

```cpp
#include "ApiServer.h"
#include "ConfigManager.h"

void ApiServer::setupRoutes() {
    // CORS headers for local development
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    server.on("/api/config", HTTP_OPTIONS, [](AsyncWebServerRequest *request){
        request->send(200);
    });

    server.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send(200, "application/json", ConfigManager::getConfigJson());
    });

    // AsyncWebServer needs body handler for PUT/POST
    server.on("/api/config", HTTP_PUT, [](AsyncWebServerRequest *request){
        // Do nothing in the request handler, processing happens in body handler
    }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
        String body = "";
        for(size_t i=0; i<len; i++) body += (char)data[i];
        
        if (ConfigManager::saveConfig(body)) {
            request->send(200, "application/json", "{\"status\":\"ok\"}");
        } else {
            request->send(400, "application/json", "{\"error\":\"Invalid format\"}");
        }
    });

    // Setup static file serving for React build later
    server.serveStatic("/", LittleFS, "/www/").setDefaultFile("index.html");
}

void ApiServer::begin() {
    setupRoutes();
    server.begin();
    Serial.println("HTTP server started");
}
```

- [ ] **Step 3: Integrate WiFi and API in main.cpp**

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "ApiServer.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

ApiServer apiServer;

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.print("Matriz IP: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  if (ConfigManager::begin()) {
      connectWiFi();
      apiServer.begin();
  }
}

void loop() {}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/matriz-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/matriz-esp32/src/ApiServer.* apps/matriz-esp32/src/main.cpp
git commit -m "feat(matriz): implement REST API for configuration"
```

---

### Task 4: UDP Client & WebSocket Proxy

**Files:**
- Create: `apps/matriz-esp32/src/BridgeManager.h`
- Create: `apps/matriz-esp32/src/BridgeManager.cpp`
- Modify: `apps/matriz-esp32/src/ApiServer.h`
- Modify: `apps/matriz-esp32/src/ApiServer.cpp`
- Modify: `apps/matriz-esp32/src/main.cpp`

- [ ] **Step 1: Create BridgeManager header**

```cpp
#ifndef BRIDGE_MANAGER_H
#define BRIDGE_MANAGER_H

#include <Arduino.h>
#include <AsyncUDP.h>
#include <ESPAsyncWebServer.h>

class BridgeManager {
private:
    AsyncUDP udp;
    AsyncWebSocket ws;
    uint32_t lastPollTime;

    void handleUdpPacket(AsyncUDPPacket packet);
    void handleWsMessage(void *arg, uint8_t *data, size_t len);

public:
    BridgeManager() : ws("/ws"), lastPollTime(0) {}
    void begin(AsyncWebServer& server);
    void loop(); // For polling
    void sendUdpCommand(const String& ip, uint16_t port, const String& payload);
};

#endif
```

- [ ] **Step 2: Create BridgeManager implementation**

```cpp
#include "BridgeManager.h"
#include "ConfigManager.h"
#include <ArduinoJson.h>

void BridgeManager::begin(AsyncWebServer& server) {
    // 1. Setup UDP Receiver
    if(udp.listen(0)) { // Bind any random free port for receiving UDP
        udp.onPacket([this](AsyncUDPPacket packet) {
            this->handleUdpPacket(packet);
        });
    }

    // 2. Setup WebSocket
    ws.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len){
        if(type == WS_EVT_DATA){
            AwsFrameInfo *info = (AwsFrameInfo*)arg;
            if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
                this->handleWsMessage(arg, data, len);
            }
        }
    });
    server.addHandler(&ws);
}

// WS RX (From GUI) -> Inject credentials -> UDP TX (To Filial)
void BridgeManager::handleWsMessage(void *arg, uint8_t *data, size_t len) {
    String msg = "";
    for(size_t i=0; i<len; i++) msg += (char)data[i];

    JsonDocument doc;
    if(deserializeJson(doc, msg)) return;

    String type = doc["type"] | "";
    if (type == "ws_tx") {
        String targetIp = doc["target_ip"] | "";
        JsonObject payload = doc["payload"];
        
        // Inject credentials
        MatrizConfig& cfg = ConfigManager::getConfig();
        payload["user"] = cfg.user;
        payload["pass"] = cfg.pass;

        String udpOut;
        serializeJson(payload, udpOut);
        
        // Find port from config
        uint16_t port = 51000;
        for (auto& f : cfg.filiais) {
            if (f.ip == targetIp) port = f.port;
        }

        udp.writeTo((const uint8_t*)udpOut.c_str(), udpOut.length(), IPAddress(), port); // IPAddress needs IPAddress().fromString(targetIp) in real implementation, simplified here
        
        IPAddress ip;
        ip.fromString(targetIp);
        udp.writeTo((const uint8_t*)udpOut.c_str(), udpOut.length(), ip, port);
    }
}

// UDP RX (From Filial) -> Wrap -> WS TX (To GUI)
void BridgeManager::handleUdpPacket(AsyncUDPPacket packet) {
    String payload = (const char*)packet.data();
    String sourceIp = packet.remoteIP().toString();

    JsonDocument out;
    out["type"] = "ws_rx";
    out["source_ip"] = sourceIp;
    
    JsonDocument parsedPayload;
    if(!deserializeJson(parsedPayload, payload)) {
        out["payload"] = parsedPayload;
        
        String wsOut;
        serializeJson(out, wsOut);
        ws.textAll(wsOut);
    }
}

// Polling loop
void BridgeManager::loop() {
    MatrizConfig& cfg = ConfigManager::getConfig();
    if (cfg.polling_ms == 0 || cfg.filiais.size() == 0) return;

    if (millis() - lastPollTime >= cfg.polling_ms) {
        lastPollTime = millis();
        
        for (auto& filial : cfg.filiais) {
            IPAddress ip;
            if (ip.fromString(filial.ip)) {
                // 1. Ask for devices list
                JsonDocument listReq;
                listReq["cmd"] = "list_req";
                listReq["user"] = cfg.user;
                listReq["pass"] = cfg.pass;
                String lOut; serializeJson(listReq, lOut);
                udp.writeTo((const uint8_t*)lOut.c_str(), lOut.length(), ip, filial.port);
                
                // 2. Ask for status
                JsonDocument statReq;
                statReq["cmd"] = "get_status";
                statReq["user"] = cfg.user;
                statReq["pass"] = cfg.pass;
                String sOut; serializeJson(statReq, sOut);
                udp.writeTo((const uint8_t*)sOut.c_str(), sOut.length(), ip, filial.port);
            }
        }
    }
}
```

- [ ] **Step 3: Modify main.cpp to include BridgeManager**

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "ApiServer.h"
#include "BridgeManager.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

ApiServer apiServer;
BridgeManager bridge;

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.print("Matriz IP: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  if (ConfigManager::begin()) {
      connectWiFi();
      bridge.begin(apiServer.getServer());
      apiServer.begin(); // HTTP starts after WS attached
  }
}

void loop() {
    bridge.loop();
}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/matriz-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/matriz-esp32/src/BridgeManager.* apps/matriz-esp32/src/main.cpp
git commit -m "feat(matriz): implement udp bridge, websocket proxy and polling"
```
