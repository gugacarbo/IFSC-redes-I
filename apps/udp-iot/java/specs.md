# udp-iot-java — Especificação de Implementação

> **Propósito:** Reimplementar o sistema de monitoramento/controle IoT (original em C++/ESP32) em Java
> **Disciplina:** Redes I — IFSC
> **Stack:** Java puro (javac, sem Maven/Gradle), JSON manual (sem dependências externas)

---

## 1. Visão Geral

Substituir os firmwares ESP32 (`matriz-esp32`, `filial-esp32`) por aplicações Java executando em PCs/Linux, mantendo o **mesmo protocolo UDP** e compatibilidade com o frontend React (`matriz-gui`) via WebSocket + REST.

```
+-----------------------+      WebSocket :8080      +-----------------------+
|  Browser (React GUI)  | <-----------------------> |  MATRIZ JAVA          |
|  (existente)          |    ws://<host>:8080/ws     |  (MatrizMain)         |
|                       |                           |                       |
|                       |    REST :8080              |  - AppServer (:8080) |
|                       |    GET|PUT /api/config     |  - BridgeManager      |
|                       |                           |  - UdpClient          |
+-----------------------+                           |  - PollingManager     |
                                                     +----------+------------+
                                                                |
                                                   UDP unicast  |
                                                   Porta 51000  |
                                                                |
                    +-------------------------------+------------+------------+
                    |                               |                        |
                    v                               v                        v
          +---------------------+        +---------------------+     +---------------------+
          | FILIAL JAVA A       |        | FILIAL JAVA B       |     | FILIAL JAVA C       |
          | (FilialMain)        |        | (FilialMain)        |     | (FilialMain)        |
          |                     |        |                     |     |                     |
          | UdpServer :51000    |        | UdpServer :51000    |     | UdpServer :51000    |
          | DeviceManager       |        | DeviceManager       |     | DeviceManager       |
          | CommandProcessor    |        | CommandProcessor    |     | CommandProcessor    |
          +---------------------+        +---------------------+     +---------------------+
```

## 2. Estrutura de Arquivos

```
apps/udp-iot-java/
├── package.json              # Scripts Turbo: build, dev (javac)
├── specs.md                  # Este documento
├── .gitignore
├── config/
│   ├── config_matriz.json    # Configuração da matriz
│   └── config_filial.json    # Configuração da filial
└── src/
    ├── shared/
    │   ├── Json.java          # Parser/builder JSON zero-dependência
    │   └── Protocol.java      # Constantes do protocolo UDP
    ├── filial/
    │   ├── FilialMain.java    # Entry point da filial
    │   ├── ConfigManager.java # Carrega config_filial.json
    │   ├── DeviceState.java   # Modelo de estado do dispositivo
    │   ├── DeviceManager.java # Gerencia dispositivos (CRUD)
    │   ├── UdpServer.java     # Servidor UDP (DatagramSocket)
    │   └── CommandProcessor.java # Processa comandos recebidos
    └── matriz/
        ├── MatrizMain.java     # Entry point da matriz
        ├── ConfigManager.java  # Carrega/salva config_matriz.json
        ├── FilialInfo.java     # Info de conexão da filial
        ├── UdpClient.java      # Cliente UDP para filiais
        ├── AppServer.java     # HTTP + WebSocket server
        ├── WebSocketSession.java # Gerenciamento de sessões WS
        ├── ApiHandler.java     # Rotas REST /api/config
        ├── BridgeManager.java  # Ponte WS <-> UDP
        └── PollingManager.java # Polling periódico das filiais
```

## 3. Protocolo UDP (Compatível com o original C++)

### 3.1 Especificação do Datagrama

- **Transporte:** UDP unicast
- **Porta padrão:** 51000
- **Payload:** JSON em UTF-8
- **Autenticação:** campos `user` + `pass` em toda requisição
- **Novidade:** campo opcional `req_id` (UUID string) para correlação request-response

### 3.2 Comandos

| Comando | Direção | Descrição |
|---------|---------|-----------|
| `list_req` | Matriz → Filial | Solicita lista de IDs dos dispositivos |
| `list_resp` | Filial → Matriz | Array de IDs |
| `get_status` | Matriz → Filial | Solicita estados de todos dispositivos |
| `get_resp` | Filial → Matriz | Pares chave-valor dos estados |
| `set_req` | Matriz → Filial | Altera valor de um dispositivo |
| `set_resp` | Filial → Matriz | Confirmação com novo valor |

### 3.3 Formatos JSON

```
▶ list_req / list_resp:
  REQ  → {"cmd":"list_req","user":"admin","pass":"admin"}
  RESP → {"cmd":"list_resp","id":["actuator_light_sala","sensor_light_sala"]}

▶ get_status / get_resp:
  REQ  → {"cmd":"get_status","user":"admin","pass":"admin"}
  RESP → {"cmd":"get_resp","actuator_light_sala":true,
           "sensor_light_sala":false,"actuator_ac_escritorio":720}

▶ set_req / set_resp:
  REQ  → {"cmd":"set_req","user":"admin","pass":"admin",
           "id":"actuator_light_sala","value":true}
  RESP → {"cmd":"set_resp","id":"actuator_light_sala","value":true}
```

### 3.4 Respostas de Erro

```json
{"error":"Invalid JSON"}
{"error":"Missing credentials"}
{"error":"Unauthorized"}
{"error":"Missing id"}
{"error":"Device not found"}
{"error":"Read only"}
{"error":"Unknown command"}
```

## 4. WebSocket (Bridge para GUI)

### 4.1 Handshake

- Endpoint: `ws://<host>:8080/ws`
- Upgrade HTTP → WebSocket conforme RFC 6455
- Server-side: implementação manual via `ServerSocket`

### 4.2 Mensagens

**GUI → Matriz (`ws_tx`):**
```json
{
  "type": "ws_tx",
  "target_ip": "192.168.1.100",
  "payload": {"cmd": "set_req", "id": "actuator_light_sala", "value": true}
}
```

**Matriz → GUI (`ws_rx`):**
```json
{
  "type": "ws_rx",
  "source_ip": "192.168.1.100",
  "payload": {"cmd": "set_resp", "id": "actuator_light_sala", "value": true}
}
```

## 5. REST API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/config` | Retorna JSON da configuração da matriz |
| `PUT` | `/api/config` | Atualiza configuração (body JSON) |
| `OPTIONS` | `/api/config` | CORS preflight |
| `GET` | `/health` | Health check |

## 6. Componentes Java

### 6.1 Shared

#### `Json.java`
Parser/builder JSON **zero-dependência** (stdlib pura). Suporta:
- Objetos aninhados (`JsonObject`)
- Arrays (`JsonArray`)
- Tipos: string, número, booleano, null
- `Json.parse(String)` → `JsonValue`
- `JsonValue.asObject()`, `.asArray()`, `.asString()`, `.asInt()`, `.asBoolean()`
- `Json.object().put("key", value).toString()`
- `Json.array().add(value).toString()`
- Escape/unescape de strings

#### `Protocol.java`
Constantes do protocolo:
- `CMD_LIST_REQ`, `CMD_LIST_RESP`, `CMD_GET_STATUS`, `CMD_GET_RESP`, `CMD_SET_REQ`, `CMD_SET_RESP`
- `FIELD_CMD`, `FIELD_USER`, `FIELD_PASS`, `FIELD_ID`, `FIELD_VALUE`, `FIELD_ERROR`
- `ERR_INVALID_JSON`, `ERR_MISSING_CREDENTIALS`, `ERR_UNAUTHORIZED`, etc.
- `DEFAULT_PORT`, `DEFAULT_USER`, `DEFAULT_PASS`
- `isSensor(String deviceId)`, `isLight(String deviceId)`

### 6.2 Filial

#### `FilialMain.java`
- Carrega config do JSON
- Inicializa `DeviceManager` com IDs do config
- Inicializa `UdpServer` na porta configurada
- Loop principal dorme (thread principal mantida viva)

#### `ConfigManager.java`
- `loadConfig(String path)` → lê JSON, parseia `FilialConfig` (port, admin_user, admin_pass, id[])
- `FilialConfig` inner class com getters

#### `DeviceState.java`
```java
class DeviceState {
    boolean isLight;      // true=booleano, false=analógico 0-1023
    String deviceType;    // "light" ou "ac"
    String place;         // ex: "sala", "escritorio"
    boolean boolValue;    // usado se isLight
    int intValue;         // usado se !isLight, range 0-1023
}
```

#### `DeviceManager.java`
- `Map<String, DeviceState>` interno
- `init(List<String> ids)` — cria estados iniciais (light=false, ac=0)
- `get(String id)` → `DeviceState` ou null
- `set(String id, boolean value)` — apenas para lights
- `set(String id, int value)` — apenas para ACs, clamp 0-1023
- `list()` → `List<String>` de todos os IDs
- `getAll()` → `Map<String, DeviceState>` para serialização

#### `UdpServer.java`
- `DatagramSocket` bind na porta configurada
- Thread dedicada com `while(running)` loop
- Recebe pacotes, delega para `CommandProcessor`, envia resposta
- `ThreadPoolExecutor` para processamento concorrente

#### `CommandProcessor.java`
- `process(String json, InetAddress sourceAddr, int sourcePort)` → `String` resposta
- Parseia JSON, autentica, roteia comando
- Chama `DeviceManager` para operações
- Retorna JSON de resposta ou erro

### 6.3 Matriz

#### `MatrizMain.java`
- Carrega config
- Inicializa `ConfigManager`, `UdpClient`, `BridgeManager`, `PollingManager`, `AppServer`
- Inicia todos os componentes
- Mantém JVM viva

#### `ConfigManager.java`
- `loadConfig(String path)` / `saveConfig(String path, String json)`
- `MatrizConfig` inner class: `user`, `pass`, `polling_ms`, `List<FilialInfo> filiais`
- Valida JSON antes de salvar (requer `user` + `pass`)

#### `FilialInfo.java`
```java
class FilialInfo {
    String name;
    String ip;
    int port;
    long lastSeen;  // timestamp último contato
    boolean online; // true se lastSeen < 15s
}
```

#### `UdpClient.java`
- `send(String ip, int port, String json)` — envia datagrama
- `receive(int timeoutMs)` — recebe resposta (blocking com timeout)
- `sendAndReceive(String ip, int port, String json, int timeoutMs)` → `String` resposta
- Método sincronizado para correlação request-response

#### `AppServer.java`
- `com.sun.net.httpserver.AppServer` na porta 8080
- Registra contextos: `/api/config`, `/health`
- Gerencia `ServerSocket` adicional na mesma porta para WebSocket
  - Alternativa: usar `ServerSocket` único que detecta Upgrade header
  - Faz upgrade handshake RFC 6455
  - Gerencia conexões WebSocket (recebe/envia frames)
- Encaminha mensagens WS para `BridgeManager`

#### `WebSocketSession.java`
- Wrapper de `Socket` + streams
- Handshake HTTP → WebSocket
- Envio de frames texto (opcode 0x1, unmasked)
- Recebimento de frames texto (handle masking)
- Ping/Pong keepalive
- Fechamento graceful

#### `ApiHandler.java`
- Handler para `HttpExchange` do `/api/config`
- `GET`: retorna `configManager.getConfigJson()`
- `PUT`: lê body, chama `configManager.saveConfig()`
- `OPTIONS`: CORS headers
- Adiciona headers CORS em todas respostas

#### `BridgeManager.java`
- Mantém `List<WebSocketSession>` de clientes conectados
- `handleWsMessage(String msg, WebSocketSession session)`:
  - Parseia `ws_tx`
  - Extrai `target_ip`, busca porta no config
  - Injeta `user`/`pass` no payload
  - Envia via `UdpClient.send()`
  - Recebe resposta, encapsula em `ws_rx`, envia de volta ao WebSocket
- `broadcast(JsonObject envelope)` — envia a todos WS clients
- Método chamado pelo `AppServer` quando chega UDP response

#### `PollingManager.java`
- `ScheduledExecutorService` com `scheduleAtFixedRate`
- A cada `polling_ms` milissegundos:
  - Para cada filial no config:
    - Envia `list_req`
    - Envia `get_status`
    - Recebe respostas
    - Encapsula em `ws_rx` e faz `broadcast()`
- Se `polling_ms == 0`, não faz polling

## 7. Concorrência (Threading)

| Componente | Thread | Responsabilidade |
|------------|--------|------------------|
| UdpServer (Filial) | 1 thread listener + pool | `DatagramSocket.receive()` loop |
| CommandProcessor | ThreadPoolExecutor | Processa comandos em paralelo |
| AppServer (Matriz) | AppServer thread pool | Requisições REST |
| WebSocket acceptor | 1 thread | Aceita novas conexões WS |
| WebSocket sessions | 1 thread por sessão | Leitura de frames |
| UdpClient (Matriz) | Pool do AppServer | Envio/recepção UDP síncrono |
| PollingManager | ScheduledExecutorService | Polling periódico |
| Main | 1 thread (dorme) | Mantém JVM viva |

**Estado compartilhado** (protegido por `synchronized` ou `ConcurrentHashMap`):
- `DeviceManager.devices` — `ConcurrentHashMap`
- `BridgeManager.sessions` — `CopyOnWriteArrayList<WebSocketSession>`
- `ConfigManager.config` — `synchronized` getter/setter

## 8. Configuração

### `config/config_matriz.json`
```json
{
  "user": "admin",
  "pass": "admin",
  "polling_ms": 5000,
  "filiais": [
    {"name": "Filial A", "ip": "127.0.0.1", "port": 51000},
    {"name": "Filial B", "ip": "127.0.0.2", "port": 51000}
  ]
}
```

### `config/config_filial.json`
```json
{
  "port": 51000,
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

## 9. Scripts (package.json)

| Script | Comando | Descrição |
|--------|---------|-----------|
| `build` | `javac -d dist src/**/*.java` | Compila tudo |
| `dev:matriz` | `java -cp dist matriz.MatrizMain` | Executa matriz |
| `dev:filial` | `java -cp dist filial.FilialMain` | Executa filial |
| `clean` | `rm -rf dist` | Limpa build |
| `typecheck` | `javac -Xlint -d dist src/**/*.java` | Compila com warnings |

## 10. Compatibilidade com Frontend React

O Java Matriz é compatível com `matriz-gui/` (React) existente, **desde que**:
1. O React aponte para o host:porta do Java Matriz (configurável no `useIoT.ts`)
2. A porta WebSocket seja a mesma (8080) configurada no React
3. O formato das mensagens WS seja idêntico (`ws_tx`/`ws_rx`)

## 11. Checklist de Implementação

- [ ] **Task 1:** `Json.java` — parser/builder JSON (zero dependências)
- [ ] **Task 2:** `Protocol.java` — constantes do protocolo
- [ ] **Task 3:** `FilialInfo.java`, `DeviceState.java` — modelos de dados
- [ ] **Task 4:** `ConfigManager.java` (filial) — leitura de config
- [ ] **Task 5:** `DeviceManager.java` — CRUD de dispositivos
- [ ] **Task 6:** `CommandProcessor.java` — processamento de comandos
- [ ] **Task 7:** `UdpServer.java` (filial) — servidor UDP
- [ ] **Task 8:** `FilialMain.java` — entry point + integração
- [ ] **Task 9:** `ConfigManager.java` (matriz) + `FilialInfo.java`
- [ ] **Task 10:** `UdpClient.java` (matriz) — comunicação UDP
- [ ] **Task 11:** `WebSocketSession.java` — sessão WS (RFC 6455)
- [ ] **Task 12:** `AppServer.java` — HTTP + WS server
- [ ] **Task 13:** `ApiHandler.java` — REST API /api/config
- [ ] **Task 14:** `BridgeManager.java` — ponte WS ↔ UDP
- [ ] **Task 15:** `PollingManager.java` — polling periódico
- [ ] **Task 16:** `MatrizMain.java` — entry point + integração
- [ ] **Task 17:** Teste manual: filial + matriz + GUI
