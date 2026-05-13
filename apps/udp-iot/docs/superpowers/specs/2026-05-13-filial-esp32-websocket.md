# WebSocket no filial-esp32

**Data:** 2026-05-13
**Status:** Aprovado

## Arquitetura

```
filial-gui (React) -- WS/HTTP --> filial-esp32 (ESPAsyncWebServer porta 80)
                                     │
                                  UdpServer (porta config) <-- Matriz
```

O ESP32 expõe WebSocket + REST API pra GUI (mesmo protocolo do `filial-java`), e mantém o servidor UDP pra comunicação com a Matriz.

## Dependência

Adicionar ao `platformio.ini`:
```ini
lib_deps =
    bblanchon/ArduinoJson @ ^7.0.4
    mathieucarbou/ESPAsyncWebServer @ ^3.6.0
```

## Componentes

### 1. `ApiServer` (novo)

Igual ao `matriz-esp32/src/ApiServer.h/.cpp`, adaptado pra REST API de devices:

```cpp
class ApiServer {
private:
    AsyncWebServer server;
    DeviceManager* devMgr;
    void setupRoutes();
public:
    ApiServer() : server(80) {}
    void begin(DeviceManager* mgr);
};
```

**Rotas:**

| Método | Rota | Handler |
|--------|------|---------|
| `OPTIONS` | `/api/devices` | CORS preflight |
| `GET` | `/api/devices` | Lista devices via `devMgr->getAllJson()` |
| `POST` | `/api/devices` | Adiciona device, corpo `{"id":"..."}` |
| `DELETE` | `/api/devices/*` | Remove (parseia ID do path), corpo opcional |
| `OPTIONS` | `/api/config` | CORS preflight |
| `GET` | `/api/config` | Config JSON (igual matriz-esp32) |
| `PUT` | `/api/config` | Atualiza config |
| `GET` | `/health` | `{"status":"ok","devices":N}` |

**Nota:** ESPAsyncWebServer não suporta path params nativamente. DELETE usa handler com prefixo `/api/devices/` e extrai o ID do `request->url()`.

### 2. `DeviceBridge` (novo)

Adaptado do `matriz-esp32/src/BridgeManager.h/.cpp`, mas conecta WS direto ao DeviceManager local (sem UDP intermediário):

```cpp
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
```

**Mensagens do cliente:**
- `{"type":"set_device","id":"...","value":true|512}`
- `{"type":"add_device","id":"..."}`
- `{"type":"remove_device","id":"..."}`

**Broadcast:** `{"type":"devices_updated","devices":[...]}` após cada mudança.

### 3. `DeviceManager` — métodos novos

```cpp
bool addDevice(const String& id);
bool removeDevice(const String& id);
String getAllJson();  // retorna JSON string de todos devices com estado
```

- `getAllJson()` formata: `[{"id":"...","isLight":true,"isSensor":false,"boolValue":false,"intValue":0},...]`
- `addDevice`/`removeDevice` retornam bool indicando sucesso

### 4. `FilialConfig` — campo http_port

```cpp
struct FilialConfig {
    uint16_t port;
    uint16_t http_port;    // novo: default 80
    String admin_user;
    String admin_pass;
    std::vector<String> devices;
};
```

- `ConfigManager::loadConfig` lê `http_port` (default 80)
- `ApiServer` usa esta porta

### 5. `main.cpp`

Nova sequência:

```cpp
FilialConfig globalConfig;
DeviceManager deviceManager;
UdpServerWrapper udpServer;
DeviceBridge deviceBridge;
ApiServer apiServer;

void setup() {
    Serial.begin(115200);
    
    // 1. Config
    if (ConfigManager::begin()) {
        if (ConfigManager::loadConfig(globalConfig)) {
            deviceManager.init(globalConfig.devices);
        }
    }
    
    // 2. WiFi
    connectWiFi();
    
    // 3. UDP (Matriz)
    udpServer.begin(&globalConfig, &deviceManager);
    
    // 4. Bridge WS + ApiServer HTTP (GUI)
    deviceBridge.begin(apiServer.getServer(), &deviceManager);
    apiServer.begin(&deviceManager);
}

void loop() {
    delay(1000);
}
```

## Protocolo WebSocket (idêntico ao filial-java)

- **Server push:** `{"type":"devices_updated","devices":[{"id":"...","isLight":true,"isSensor":false,"boolValue":true,"intValue":0}]}`
- **Client → Server:** `{"type":"set_device","id":"actuator_light_sala","value":true}`
- **Client → Server:** `{"type":"add_device","id":"actuator_light_cozinha"}`
- **Client → Server:** `{"type":"remove_device","id":"actuator_light_cozinha"}`

## Observações

- Filial-esp32 não persiste alterações de device em LittleFS (diferente do filial-java que salva config). Add/remove são voláteis (reset volta ao config inicial).
- `DeviceManager` não tem getter de sensor — usa `id.indexOf("sensor_")` pra detectar (presente no `UdpServer.cpp` indiretamente). O JSON de resposta inclui `isSensor` pra GUI.
- A porta HTTP padrão é 80 (WebSocket e REST no mesmo server), configurável via JSON.
