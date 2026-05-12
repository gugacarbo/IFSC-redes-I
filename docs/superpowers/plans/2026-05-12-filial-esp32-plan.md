# Filial ESP32 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the UDP server on ESP32 that simulates IoT devices (lights, AC), loads configurations from LittleFS, and responds to UDP unicast commands securely (requiring user/pass).

**Architecture:** C++ (PlatformIO / Arduino Framework). Uses LittleFS to read `config_filial.json`. Uses standard WiFi and AsyncUDP to listen on port 51000. Uses ArduinoJson for parsing and building payloads. Simulates device states in memory.

**Tech Stack:** PlatformIO, Arduino framework, ESP32, LittleFS, ArduinoJson, AsyncUDP.

---

### Task 1: Setup PlatformIO and Dependencies

**Files:**
- Create: `apps/filial-esp32/platformio.ini`
- Create: `apps/filial-esp32/src/main.cpp`
- Create: `apps/filial-esp32/data/config_filial.json`

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
```

- [ ] **Step 2: Create default configuration file in `data/`**

```json
{
  "port": 51000,
  "admin_user": "test",
  "admin_pass": "test",
  "id": [
    "actuator_light_sala",
    "sensor_light_sala",
    "actuator_ac_escritorio",
    "sensor_ac_escritorio"
  ]
}
```

- [ ] **Step 3: Create skeleton `main.cpp`**

```cpp
#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  Serial.println("Starting Filial ESP32...");
}

void loop() {
}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/filial-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/filial-esp32/
git commit -m "feat(filial): setup platformio, dependencies and base config"
```

---

### Task 2: Config Manager (LittleFS)

**Files:**
- Create: `apps/filial-esp32/src/ConfigManager.h`
- Create: `apps/filial-esp32/src/ConfigManager.cpp`
- Modify: `apps/filial-esp32/src/main.cpp`

- [ ] **Step 1: Create ConfigManager header**

```cpp
#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <vector>

struct FilialConfig {
    uint16_t port;
    String admin_user;
    String admin_pass;
    std::vector<String> devices;
};

class ConfigManager {
public:
    static bool begin();
    static bool loadConfig(FilialConfig& config);
};

#endif
```

- [ ] **Step 2: Create ConfigManager implementation**

```cpp
#include "ConfigManager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

bool ConfigManager::begin() {
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS Mount Failed");
        return false;
    }
    return true;
}

bool ConfigManager::loadConfig(FilialConfig& config) {
    File file = LittleFS.open("/config_filial.json", "r");
    if (!file) {
        Serial.println("Failed to open config file");
        return false;
    }

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, file);
    if (error) {
        Serial.println("Failed to parse config file");
        return false;
    }

    config.port = doc["port"] | 51000;
    config.admin_user = doc["admin_user"] | "test";
    config.admin_pass = doc["admin_pass"] | "test";
    
    config.devices.clear();
    JsonArray ids = doc["id"];
    for (JsonVariant v : ids) {
        config.devices.push_back(v.as<String>());
    }

    file.close();
    return true;
}
```

- [ ] **Step 3: Test loading in main.cpp**

```cpp
#include <Arduino.h>
#include "ConfigManager.h"

FilialConfig globalConfig;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting Filial ESP32...");
  
  if (ConfigManager::begin()) {
      if (ConfigManager::loadConfig(globalConfig)) {
          Serial.printf("Loaded! Port: %d, User: %s, Devices: %d\n", 
            globalConfig.port, globalConfig.admin_user.c_str(), globalConfig.devices.size());
      }
  }
}

void loop() {}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/filial-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/filial-esp32/src/ConfigManager.* apps/filial-esp32/src/main.cpp
git commit -m "feat(filial): load configuration from littlefs using arduinojson"
```

---

### Task 3: Device State Manager

**Files:**
- Create: `apps/filial-esp32/src/DeviceManager.h`
- Create: `apps/filial-esp32/src/DeviceManager.cpp`
- Modify: `apps/filial-esp32/src/main.cpp`

- [ ] **Step 1: Create DeviceManager header**

```cpp
#ifndef DEVICE_MANAGER_H
#define DEVICE_MANAGER_H

#include <Arduino.h>
#include <map>
#include <vector>

struct DeviceState {
    bool is_light; // true if light, false if AC
    bool bool_val; // for light
    int int_val;   // for AC (0-1023)
};

class DeviceManager {
private:
    std::map<String, DeviceState> devices;
public:
    void init(const std::vector<String>& device_ids);
    bool get(const String& id, DeviceState& out_state);
    bool set(const String& id, bool val);
    bool set(const String& id, int val);
    std::vector<String> list();
};

#endif
```

- [ ] **Step 2: Create DeviceManager implementation**

```cpp
#include "DeviceManager.h"

void DeviceManager::init(const std::vector<String>& device_ids) {
    devices.clear();
    for (const String& id : device_ids) {
        DeviceState state;
        state.is_light = id.indexOf("_light_") != -1;
        state.bool_val = false;
        state.int_val = 0;
        devices[id] = state;
    }
}

bool DeviceManager::get(const String& id, DeviceState& out_state) {
    if (devices.find(id) != devices.end()) {
        out_state = devices[id];
        return true;
    }
    return false;
}

bool DeviceManager::set(const String& id, bool val) {
    if (devices.find(id) != devices.end() && devices[id].is_light) {
        devices[id].bool_val = val;
        return true;
    }
    return false;
}

bool DeviceManager::set(const String& id, int val) {
    if (devices.find(id) != devices.end() && !devices[id].is_light) {
        if (val < 0) val = 0;
        if (val > 1023) val = 1023;
        devices[id].int_val = val;
        return true;
    }
    return false;
}

std::vector<String> DeviceManager::list() {
    std::vector<String> keys;
    for (auto const& pair : devices) {
        keys.push_back(pair.first);
    }
    return keys;
}
```

- [ ] **Step 3: Integrate into main.cpp**

```cpp
#include <Arduino.h>
#include "ConfigManager.h"
#include "DeviceManager.h"

FilialConfig globalConfig;
DeviceManager deviceManager;

void setup() {
  Serial.begin(115200);
  
  if (ConfigManager::begin()) {
      if (ConfigManager::loadConfig(globalConfig)) {
          deviceManager.init(globalConfig.devices);
          Serial.println("Devices initialized.");
      }
  }
}

void loop() {}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/filial-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/filial-esp32/src/DeviceManager.* apps/filial-esp32/src/main.cpp
git commit -m "feat(filial): implement device state manager"
```

---

### Task 4: WiFi Setup

**Files:**
- Modify: `apps/filial-esp32/src/main.cpp`

- [ ] **Step 1: Add simple WiFi setup to main.cpp**
*(Note: To keep this plan focused and testable, we hardcode WiFi for now. Advanced provisioning can be added later)*

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "DeviceManager.h"

// Hardcode for testing environment
const char* WIFI_SSID = "WOKWI-GUEST"; // Typical test/simulator SSID
const char* WIFI_PASS = "";

FilialConfig globalConfig;
DeviceManager deviceManager;

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
}

void loop() {}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/filial-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add apps/filial-esp32/src/main.cpp
git commit -m "feat(filial): add wifi connection logic"
```

---

### Task 5: UDP Server & Protocol Parser

**Files:**
- Create: `apps/filial-esp32/src/UdpServer.h`
- Create: `apps/filial-esp32/src/UdpServer.cpp`
- Modify: `apps/filial-esp32/src/main.cpp`

- [ ] **Step 1: Create UdpServer header**

```cpp
#ifndef UDP_SERVER_H
#define UDP_SERVER_H

#include <Arduino.h>
#include <AsyncUDP.h>
#include "DeviceManager.h"
#include "ConfigManager.h"

class UdpServerWrapper {
private:
    AsyncUDP udp;
    DeviceManager* devMgr;
    FilialConfig* config;
    void handlePacket(AsyncUDPPacket packet);
    String processRequest(const String& payload);

public:
    void begin(FilialConfig* cfg, DeviceManager* mgr);
};

#endif
```

- [ ] **Step 2: Create UdpServer implementation**

```cpp
#include "UdpServer.h"
#include <ArduinoJson.h>

void UdpServerWrapper::begin(FilialConfig* cfg, DeviceManager* mgr) {
    this->config = cfg;
    this->devMgr = mgr;
    
    if (udp.listen(cfg->port)) {
        Serial.printf("UDP Listening on port %d\n", cfg->port);
        udp.onPacket([this](AsyncUDPPacket packet) {
            this->handlePacket(packet);
        });
    }
}

void UdpServerWrapper::handlePacket(AsyncUDPPacket packet) {
    String payload = (const char*)packet.data();
    String response = processRequest(payload);
    if (response.length() > 0) {
        packet.print(response);
    }
}

String UdpServerWrapper::processRequest(const String& payload) {
    JsonDocument req;
    DeserializationError err = deserializeJson(req, payload);
    if (err) return "{\"error\":\"Invalid JSON\"}";

    // 1. Auth check
    if (!req.containsKey("user") || !req.containsKey("pass")) return "{\"error\":\"Missing credentials\"}";
    if (req["user"] != config->admin_user || req["pass"] != config->admin_pass) return "{\"error\":\"Unauthorized\"}";

    String cmd = req["cmd"] | "";
    JsonDocument res;

    // 2. LIST REQ
    if (cmd == "list_req") {
        res["cmd"] = "list_resp";
        JsonArray ids = res["id"].to<JsonArray>();
        for (const String& d : devMgr->list()) {
            ids.add(d);
        }
        String output;
        serializeJson(res, output);
        return output;
    }

    // 3. GET STATUS
    if (cmd == "get_status") {
        res["cmd"] = "get_resp";
        for (const String& d : devMgr->list()) {
            DeviceState state;
            if (devMgr->get(d, state)) {
                if (state.is_light) res[d] = state.bool_val;
                else res[d] = state.int_val;
            }
        }
        String output;
        serializeJson(res, output);
        return output;
    }

    // 4. SET REQ
    if (cmd == "set_req") {
        String id = req["id"] | "";
        if (id == "") return "{\"error\":\"Missing id\"}";
        
        DeviceState state;
        if (!devMgr->get(id, state)) return "{\"error\":\"Device not found\"}";
        
        // Cannot write to sensors
        if (id.indexOf("sensor_") == 0) return "{\"error\":\"Read only\"}";

        bool success = false;
        if (state.is_light) {
            bool v = req["value"] | false;
            success = devMgr->set(id, v);
            if (success) {
                res["cmd"] = "set_resp";
                res["id"] = id;
                res["value"] = v;
            }
        } else {
            int v = req["value"] | 0;
            success = devMgr->set(id, v);
            if (success) {
                res["cmd"] = "set_resp";
                res["id"] = id;
                res["value"] = v;
            }
        }
        
        if (success) {
            String output;
            serializeJson(res, output);
            return output;
        }
    }

    return "{\"error\":\"Unknown command\"}";
}
```

- [ ] **Step 3: Integrate into main.cpp**

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "DeviceManager.h"
#include "UdpServer.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

FilialConfig globalConfig;
DeviceManager deviceManager;
UdpServerWrapper udpServer;

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
  
  // Start UDP after WiFi
  udpServer.begin(&globalConfig, &deviceManager);
}

void loop() {
    // AsyncUDP handles everything in background via interrupts/callbacks
    delay(1000);
}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/filial-esp32 && pio run`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/filial-esp32/src/UdpServer.* apps/filial-esp32/src/main.cpp
git commit -m "feat(filial): implement udp server with protocol parsing"
```
