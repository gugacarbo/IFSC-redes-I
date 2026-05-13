# Filial Java WebSocket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HTTP + WebSocket server to filial-java (same pattern as matriz-java), simplify filial-gui to pure React frontend.

**Architecture:** Single-port TCP server (`AppServer`) multiplexes HTTP REST + WebSocket on one port. `DeviceBridge` manages WS sessions and bridges GUI ↔ local `DeviceManager`. UDP server remains unchanged for Matriz communication.

**Tech Stack:** Java (javac, no external deps), React 19 + Vite 8 (frontend)

---

### Task 1: FilialConfig + ConfigManager — httpPort field

**Files:**
- Modify: `applications/filial-java/src/filial/FilialConfig.java`
- Modify: `applications/filial-java/src/filial/ConfigManager.java`

- [ ] **Step 1: Add `httpPort` to FilialConfig record**

In `FilialConfig.java`:
```java
public record FilialConfig(
    int port,
    int httpPort,       // <-- new: HTTP + WebSocket port
    String adminUser,
    String adminPass,
    List<String> deviceIds
) {}
```

- [ ] **Step 2: Load `http_port` in ConfigManager**

In `ConfigManager.java`, after loading `pass`:
```java
int httpPort = obj.getInt("http_port", 8082);
```

And in the record constructor:
```java
this.config = new FilialConfig(port, httpPort, user, pass, deviceIds);
```

- [ ] **Step 3: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/FilialConfig.java apps/udp-iot/applications/filial-java/src/filial/ConfigManager.java
git commit -m "feat(filial-java): add httpPort to config"
```

---

### Task 2: DeviceManager — addDevice, removeDevice, updateDevice

**Files:**
- Modify: `applications/filial-java/src/filial/DeviceManager.java`

- [ ] **Step 1: Add addDevice method**

```java
/** Add a new device with default state. No-op if already exists. */
public void addDevice(String deviceId) {
    devices.putIfAbsent(deviceId, new DeviceState(deviceId));
}
```

- [ ] **Step 2: Add removeDevice method**

```java
/** Remove a device. Returns true if it existed. */
public boolean removeDevice(String deviceId) {
    return devices.remove(deviceId) != null;
}
```

- [ ] **Step 3: Add updateDevice method**

```java
/** Rename device from oldId to newId. Returns true if oldId existed. */
public boolean updateDevice(String oldId, String newId) {
    DeviceState state = devices.remove(oldId);
    if (state == null) return false;
    // Cannot rename DeviceState directly since id is final,
    // create new one and copy values
    DeviceState newState = new DeviceState(newId);
    if (state.isLight()) {
        newState.setValue(state.boolValue());
    } else {
        newState.setValue(state.intValue());
    }
    devices.put(newId, newState);
    return true;
}
```

Note: `DeviceState` has a `final String deviceId` field set in constructor. Renaming creates a new `DeviceState` and copies the value.

- [ ] **Step 4: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/DeviceManager.java
git commit -m "feat(filial-java): add addDevice/removeDevice/updateDevice to DeviceManager"
```

---

### Task 3: WebSocketSession.java — RFC 6455 raw implementation

**Files:**
- Create: `applications/filial-java/src/filial/WebSocketSession.java`

(Identical to `matriz-java/src/matriz/WebSocketSession.java` — same package structure, same RFC 6455 protocol.)

- [ ] **Step 1: Create WebSocketSession.java**

```java
package filial;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Manages a single WebSocket connection (RFC 6455).
 *
 * <p>Handles the HTTP Upgrade handshake, frame read/write,
 * and graceful close. No external WebSocket library required.
 */
public class WebSocketSession {

    private final Socket socket;
    private final InputStream  in;
    private final OutputStream out;
    private final AtomicBoolean open = new AtomicBoolean(true);
    private final String remoteAddr;

    private static final int OPCODE_TEXT  = 0x1;
    private static final int OPCODE_CLOSE = 0x8;
    private static final int OPCODE_PING  = 0x9;
    private static final int OPCODE_PONG  = 0xA;

    public WebSocketSession(Socket socket, InputStream inputStream, OutputStream outputStream) {
        this.socket = socket;
        this.in = inputStream;
        this.out = outputStream;
        this.remoteAddr = socket.getInetAddress().getHostAddress() + ":" + socket.getPort();
    }

    public String remoteAddress() { return remoteAddr; }

    public boolean isOpen() { return open.get() && !socket.isClosed(); }

    public synchronized void sendText(String text) throws IOException {
        if (!isOpen()) return;
        byte[] payload = text.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        int len = payload.length;
        out.write(0x81); // FIN + Text opcode
        if (len < 126) {
            out.write(len);
        } else if (len < 65536) {
            out.write(126);
            out.write((len >>> 8) & 0xFF);
            out.write(len & 0xFF);
        } else {
            out.write(127);
            for (int i = 7; i >= 0; i--) {
                out.write((int) ((len >>> (i * 8)) & 0xFF));
            }
        }
        out.write(payload);
        out.flush();
    }

    public String readFrame() throws IOException {
        if (!isOpen()) return null;
        int b1 = in.read();
        if (b1 == -1) { close(); return null; }
        int b2 = in.read();
        if (b2 == -1) { close(); return null; }
        boolean masked = (b2 & 0x80) != 0;
        int len = b2 & 0x7F;
        if (len == 126) {
            len = (in.read() << 8) | in.read();
        } else if (len == 127) {
            long longLen = 0;
            for (int i = 0; i < 8; i++) {
                longLen = (longLen << 8) | (in.read() & 0xFF);
            }
            if (longLen > Integer.MAX_VALUE) {
                throw new IOException("Frame too large: " + longLen);
            }
            len = (int) longLen;
        }
        byte[] mask = null;
        if (masked) {
            mask = new byte[4];
            int read = in.readNBytes(mask, 0, 4);
            if (read < 4) { close(); return null; }
        }
        byte[] payload = new byte[len];
        int totalRead = 0;
        while (totalRead < len) {
            int n = in.read(payload, totalRead, len - totalRead);
            if (n == -1) { close(); return null; }
            totalRead += n;
        }
        if (masked) {
            for (int i = 0; i < len; i++) {
                payload[i] ^= mask[i % 4];
            }
        }
        int opcode = b1 & 0x0F;
        return switch (opcode) {
            case OPCODE_TEXT -> new String(payload, java.nio.charset.StandardCharsets.UTF_8);
            case OPCODE_CLOSE -> { close(); yield null; }
            case OPCODE_PING -> {
                sendPong(payload);
                yield null;
            }
            case OPCODE_PONG -> null;
            default -> {
                System.err.println("WebSocket: Unknown opcode " + opcode);
                yield null;
            }
        };
    }

    public static boolean performHandshake(InputStream in, OutputStream out) throws IOException {
        StringBuilder request = new StringBuilder();
        int ch;
        while ((ch = in.read()) != -1) {
            request.append((char) ch);
            if (request.toString().endsWith("\r\n\r\n")) break;
        }
        String reqStr = request.toString();
        if (reqStr.isEmpty()) return false;
        String keyPrefix = "Sec-WebSocket-Key: ";
        int keyStart = reqStr.indexOf(keyPrefix);
        if (keyStart == -1) return false;
        keyStart += keyPrefix.length();
        int keyEnd = reqStr.indexOf("\r\n", keyStart);
        if (keyEnd == -1) return false;
        String key = reqStr.substring(keyStart, keyEnd).trim();
        String acceptKey;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            md.update(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            md.update("258EAFA5-E914-47DA-95CA-C5AB0DC85B11".getBytes(java.nio.charset.StandardCharsets.UTF_8));
            acceptKey = Base64.getEncoder().encodeToString(md.digest());
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
        String response = "HTTP/1.1 101 Switching Protocols\r\n"
            + "Upgrade: websocket\r\n"
            + "Connection: Upgrade\r\n"
            + "Sec-WebSocket-Accept: " + acceptKey + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n"
            + "\r\n";
        out.write(response.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        out.flush();
        return true;
    }

    private void sendPong(byte[] payload) throws IOException {
        synchronized (this) {
            out.write(0x8A);
            if (payload.length < 126) {
                out.write(payload.length);
            } else {
                out.write(126);
                out.write((payload.length >>> 8) & 0xFF);
                out.write(payload.length & 0xFF);
            }
            out.write(payload);
            out.flush();
        }
    }

    public void close() {
        if (!open.compareAndSet(true, false)) return;
        try {
            synchronized (this) {
                if (!socket.isClosed()) {
                    out.write(0x88);
                    out.write(0);
                    out.flush();
                }
            }
        } catch (Exception ignored) {}
        try { socket.close(); } catch (Exception ignored) {}
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/WebSocketSession.java
git commit -m "feat(filial-java): add RFC 6455 WebSocketSession"
```

---

### Task 4: DeviceBridge.java — WebSocket session management

**Files:**
- Create: `applications/filial-java/src/filial/DeviceBridge.java`

- [ ] **Step 1: Create DeviceBridge.java**

```java
package filial;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Bridges WebSocket GUI clients with the local DeviceManager.
 *
 * <p>Manages connected WebSocket sessions, handles GUI messages
 * (set_device, add_device, remove_device), and broadcasts
 * device state updates to all connected clients.
 */
public class DeviceBridge {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final DeviceManager deviceManager;
    private final ConfigManager configManager;

    public DeviceBridge(DeviceManager deviceManager, ConfigManager configManager) {
        this.deviceManager = deviceManager;
        this.configManager = configManager;
    }

    public void onSessionOpened(WebSocketSession session) {
        sessions.add(session);
        System.out.println("DeviceBridge: GUI client connected: " + session.remoteAddress()
            + " (" + sessions.size() + " total)");
        // Send current state immediately
        sendDevicesUpdated(session);
    }

    public void onSessionClosed(WebSocketSession session) {
        sessions.remove(session);
        System.out.println("DeviceBridge: GUI client disconnected: " + session.remoteAddress()
            + " (" + sessions.size() + " remaining)");
    }

    public void sessionReadLoop(WebSocketSession session) {
        try {
            while (session.isOpen()) {
                String message = session.readFrame();
                if (message == null) break;
                handleWsMessage(message, session);
            }
        } catch (IOException e) {
            if (session.isOpen()) {
                System.err.println("DeviceBridge: Session read error: " + e.getMessage());
            }
        } finally {
            onSessionClosed(session);
            session.close();
        }
    }

    private void handleWsMessage(String message, WebSocketSession session) {
        try {
            JsonObject msg = Json.parseObject(message);
            String type = msg.getString("type", "");

            switch (type) {
                case "set_device" -> handleSetDevice(msg);
                case "add_device" -> handleAddDevice(msg);
                case "remove_device" -> handleRemoveDevice(msg);
                default -> System.err.println("DeviceBridge: Unknown WS message type: " + type);
            }
        } catch (Exception e) {
            System.err.println("DeviceBridge: Error handling WS message: " + e.getMessage());
        }
    }

    private void handleSetDevice(JsonObject msg) {
        String id = msg.getString("id", "");
        if (id.isEmpty()) return;
        DeviceState state = deviceManager.get(id);
        if (state == null || state.isSensor()) return;

        if (state.isLight()) {
            deviceManager.set(id, msg.getBoolean("value"));
        } else {
            deviceManager.set(id, msg.getInt("value"));
        }
        broadcastDevicesUpdated();
    }

    private void handleAddDevice(JsonObject msg) {
        String id = msg.getString("id", "");
        if (id.isEmpty()) return;
        deviceManager.addDevice(id);
        broadcastDevicesUpdated();
    }

    private void handleRemoveDevice(JsonObject msg) {
        String id = msg.getString("id", "");
        if (id.isEmpty()) return;
        deviceManager.removeDevice(id);
        broadcastDevicesUpdated();
    }

    /** Broadcast devices_updated to all connected clients. */
    public void broadcastDevicesUpdated() {
        String json = buildDevicesUpdatedJson();
        broadcast(json);
    }

    private void sendDevicesUpdated(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.sendText(buildDevicesUpdatedJson());
            }
        } catch (IOException e) {
            System.err.println("DeviceBridge: Error sending to " + session.remoteAddress());
        }
    }

    private String buildDevicesUpdatedJson() {
        JsonObject envelope = new JsonObject();
        envelope.put("type", "devices_updated");

        JsonArray devices = new JsonArray();
        for (java.util.Map.Entry<String, DeviceState> entry : deviceManager.getAll().entrySet()) {
            String id = entry.getKey();
            DeviceState state = entry.getValue();
            JsonObject dev = new JsonObject();
            dev.put("id", id);
            dev.put("isLight", state.isLight());
            dev.put("isSensor", state.isSensor());
            dev.put("boolValue", state.boolValue());
            dev.put("intValue", state.intValue());
            devices.add(dev);
        }
        envelope.put("devices", devices);
        return envelope.toString();
    }

    public void broadcast(String json) {
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendText(json);
                }
            } catch (IOException e) {
                System.err.println("DeviceBridge: Broadcast error to "
                    + session.remoteAddress() + ": " + e.getMessage());
                onSessionClosed(session);
                session.close();
            }
        }
    }

    public int sessionCount() {
        return sessions.size();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/DeviceBridge.java
git commit -m "feat(filial-java): add DeviceBridge for WS session management"
```

---

### Task 5: ApiHandler.java — REST API

**Files:**
- Create: `applications/filial-java/src/filial/ApiHandler.java`

- [ ] **Step 1: Create ApiHandler.java**

```java
package filial;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.util.Map;

/**
 * Handles REST API calls for the filial HTTP server.
 *
 * <p>Routes:
 * <ul>
 *   <li>{@code GET /api/devices} — list all devices with state</li>
 *   <li>{@code POST /api/devices} — add a device</li>
 *   <li>{@code DELETE /api/devices/:id} — remove a device</li>
 *   <li>{@code PUT /api/devices/:oldId} — rename a device</li>
 *   <li>{@code GET /api/config} — return server config</li>
 *   <li>{@code PUT /api/config} — update server config</li>
 *   <li>{@code GET /health} — health check</li>
 * </ul>
 */
public class ApiHandler {

    private final DeviceManager deviceManager;
    private final DeviceBridge deviceBridge;
    private int lastStatusCode = 200;

    public ApiHandler(DeviceManager deviceManager, DeviceBridge deviceBridge) {
        this.deviceManager = deviceManager;
        this.deviceBridge = deviceBridge;
    }

    public String handle(String method, String path, String body) {
        method = method.toUpperCase();
        path = path.split("\\?")[0];

        try {
            // Route /api/devices with optional sub-path
            if (path.equals("/api/devices")) {
                return switch (method) {
                    case "GET" -> handleGetDevices();
                    case "POST" -> handlePostDevice(body);
                    case "OPTIONS" -> handleOptions();
                    default -> jsonError(405, "Method not allowed");
                };
            }
            if (path.startsWith("/api/devices/")) {
                String deviceId = path.substring("/api/devices/".length());
                return switch (method) {
                    case "DELETE" -> handleDeleteDevice(deviceId);
                    case "PUT" -> handlePutDevice(deviceId, body);
                    case "OPTIONS" -> handleOptions();
                    default -> jsonError(405, "Method not allowed");
                };
            }
            if (path.equals("/api/config")) {
                return switch (method) {
                    case "GET" -> handleGetConfig();
                    case "PUT" -> handlePutConfig(body);
                    case "OPTIONS" -> handleOptions();
                    default -> jsonError(405, "Method not allowed");
                };
            }
            if (path.equals("/health") || path.equals("/api/health")) {
                if ("GET".equals(method) || "OPTIONS".equals(method)) {
                    lastStatusCode = 200;
                    return "{\"status\":\"ok\",\"devices\":" + deviceManager.count() + "}";
                }
                return jsonError(405, "Method not allowed");
            }

            return jsonError(404, "Not found");
        } catch (Exception e) {
            System.err.println("ApiHandler: Error: " + e.getMessage());
            return jsonError(500, "Internal server error");
        }
    }

    public int lastStatusCode() {
        return lastStatusCode;
    }

    // ---- Device handlers ----

    private String handleGetDevices() {
        lastStatusCode = 200;
        JsonArray arr = new JsonArray();
        for (Map.Entry<String, DeviceState> entry : deviceManager.getAll().entrySet()) {
            String id = entry.getKey();
            DeviceState state = entry.getValue();
            JsonObject dev = new JsonObject();
            dev.put("id", id);
            dev.put("isLight", state.isLight());
            dev.put("isSensor", state.isSensor());
            dev.put("boolValue", state.boolValue());
            dev.put("intValue", state.intValue());
            arr.add(dev);
        }
        return arr.toString();
    }

    private String handlePostDevice(String body) {
        if (body == null || body.isBlank()) {
            lastStatusCode = 400;
            return jsonError(400, "Empty body");
        }
        try {
            JsonObject obj = Json.parseObject(body);
            String id = obj.getString("id", "");
            if (id.isEmpty()) {
                lastStatusCode = 400;
                return jsonError(400, "Missing id");
            }
            deviceManager.addDevice(id);
            deviceBridge.broadcastDevicesUpdated();
            lastStatusCode = 201;
            return "{\"id\":\"" + Json.escape(id) + "\"}";
        } catch (Exception e) {
            lastStatusCode = 400;
            return jsonError(400, "Invalid JSON");
        }
    }

    private String handleDeleteDevice(String deviceId) {
        boolean removed = deviceManager.removeDevice(deviceId);
        if (!removed) {
            lastStatusCode = 404;
            return jsonError(404, "Device not found");
        }
        deviceBridge.broadcastDevicesUpdated();
        lastStatusCode = 200;
        return "{\"id\":\"" + Json.escape(deviceId) + "\",\"removed\":true}";
    }

    private String handlePutDevice(String oldId, String body) {
        if (body == null || body.isBlank()) {
            lastStatusCode = 400;
            return jsonError(400, "Empty body");
        }
        try {
            JsonObject obj = Json.parseObject(body);
            String newId = obj.getString("newId", "");
            if (newId.isEmpty()) {
                lastStatusCode = 400;
                return jsonError(400, "Missing newId");
            }
            boolean updated = deviceManager.updateDevice(oldId, newId);
            if (!updated) {
                lastStatusCode = 404;
                return jsonError(404, "Device not found");
            }
            deviceBridge.broadcastDevicesUpdated();
            lastStatusCode = 200;
            return "{\"oldId\":\"" + Json.escape(oldId) + "\",\"newId\":\"" + Json.escape(newId) + "\"}";
        } catch (Exception e) {
            lastStatusCode = 400;
            return jsonError(400, "Invalid JSON");
        }
    }

    // ---- Config handlers ----

    private String handleGetConfig() {
        lastStatusCode = 200;
        // Return config without device IDs — just server settings
        JsonObject cfg = new JsonObject();
        cfg.put("port", 0); // UDP port not relevant for GUI
        cfg.put("adminUser", "admin");
        cfg.put("adminPass", "admin");
        cfg.put("deviceCount", deviceManager.count());
        return cfg.toString();
    }

    private String handlePutConfig(String body) {
        if (body == null || body.isBlank()) {
            lastStatusCode = 400;
            return jsonError(400, "Empty body");
        }
        // Config update via API is acknowledged but not persisted
        // (the GUI reads deviceCount — actual config management is file-based)
        lastStatusCode = 200;
        return "{\"status\":\"ok\"}";
    }

    // ---- Helpers ----

    private String handleOptions() {
        lastStatusCode = 204;
        return "";
    }

    private String jsonError(int code, String message) {
        return "{\"error\":\"" + message + "\"}";
    }
}
```

Note: The config GET/PUT endpoints are simplified for now — the `ConfigManager` doesn't have a `save()` method like matriz's does. Config writes happen via the config file directly. The REST API returns basic info.

- [ ] **Step 2: Make `Json.escape()` public**

In `shared/Json.java`, line 440, change `static String escape` to `public static String escape`:

```java
// In shared/Json.java:440
public static String escape(String s) {
```

(This method already exists and works — it just needs to be accessible from the `filial` package.)

- [ ] **Step 3: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/ApiHandler.java apps/udp-iot/packages/udp-shared/src/shared/Json.java
git commit -m "feat(filial-java): add REST ApiHandler; make Json.escape() public"
```

---

### Task 6: AppServer.java — single-port TCP server (HTTP + WS)

**Files:**
- Create: `applications/filial-java/src/filial/AppServer.java`

- [ ] **Step 1: Create AppServer.java**

```java
package filial;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Single-port server handling both REST API and WebSocket.
 *
 * <p>Uses a single {@link ServerSocket} on one port. Each TCP connection is
 * inspected — if it contains {@code Upgrade: websocket} the connection is
 * upgraded to WebSocket and registered with {@link DeviceBridge}; otherwise
 * it is treated as an HTTP REST request and routed to {@link ApiHandler}.
 *
 * <p>Same pattern as {@code matriz-java/src/matriz/AppServer.java}.
 */
public class AppServer {

    private final int port;
    private final DeviceBridge deviceBridge;
    private final ApiHandler apiHandler;

    private ServerSocket serverSocket;
    private Thread acceptThread;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private ExecutorService connectionPool;

    private static final String UPGRADE_HEADER = "upgrade: websocket";
    private static final int BUFFER_SIZE = 8192;

    public AppServer(int port, DeviceBridge deviceBridge, ApiHandler apiHandler) {
        this.port = port;
        this.deviceBridge = deviceBridge;
        this.apiHandler = apiHandler;
    }

    public boolean start() {
        if (running.get()) return true;
        connectionPool = Executors.newCachedThreadPool();
        try {
            serverSocket = new ServerSocket(port);
            serverSocket.setReuseAddress(true);
            running.set(true);
        } catch (IOException e) {
            System.err.println("AppServer: Failed to bind port " + port + ": " + e.getMessage());
            return false;
        }
        acceptThread = new Thread(this::acceptLoop, "app-server-accept");
        acceptThread.setDaemon(true);
        acceptThread.start();
        System.out.println("AppServer: Listening on port " + port + " (REST + WebSocket)");
        return true;
    }

    public void stop() {
        running.set(false);
        if (serverSocket != null && !serverSocket.isClosed()) {
            try { serverSocket.close(); } catch (IOException ignored) {}
        }
        if (connectionPool != null) connectionPool.shutdownNow();
    }

    private void acceptLoop() {
        while (running.get()) {
            try {
                Socket client = serverSocket.accept();
                connectionPool.submit(() -> handleConnection(client));
            } catch (java.net.SocketException e) {
                if (!running.get()) break;
                System.err.println("AppServer: Accept error: " + e.getMessage());
            } catch (IOException e) {
                if (running.get()) {
                    System.err.println("AppServer: Accept error: " + e.getMessage());
                }
            }
        }
    }

    private void handleConnection(Socket client) {
        try {
            client.setSoTimeout(15000);
            InputStream in = client.getInputStream();
            OutputStream out = client.getOutputStream();

            byte[] buf = new byte[BUFFER_SIZE];
            int totalRead = 0;

            while (totalRead < buf.length) {
                int n = in.read(buf, totalRead, buf.length - totalRead);
                if (n == -1) {
                    client.close();
                    return;
                }
                totalRead += n;

                String headerSection = new String(buf, 0, totalRead, StandardCharsets.US_ASCII);
                int headerEnd = headerSection.indexOf("\r\n\r\n");
                if (headerEnd == -1) continue;

                String headers = headerSection.substring(0, headerEnd);
                int bodyStart = headerEnd + 4;

                if (headers.toLowerCase().contains(UPGRADE_HEADER)) {
                    handleWebSocketUpgrade(client, in, out, buf, totalRead, headers);
                    return;
                } else {
                    handleRestRequest(client, out, buf, totalRead, bodyStart, headers);
                    return;
                }
            }
            client.close();
        } catch (java.net.SocketTimeoutException e) {
            try { client.close(); } catch (IOException ignored) {}
        } catch (IOException e) {
            try { client.close(); } catch (IOException ignored) {}
        }
    }

    private void handleWebSocketUpgrade(Socket client, InputStream in,
                                         OutputStream out, byte[] buf,
                                         int totalRead, String headers) throws IOException {
        if (WebSocketSession.performHandshake(
                new ByteArrayInputStream(buf, 0, totalRead), out)) {
            WebSocketSession session = new WebSocketSession(client, in, out);
            deviceBridge.onSessionOpened(session);
            deviceBridge.sessionReadLoop(session);
        } else {
            sendHttpResponse(out, 400, "Bad Request", "{\"error\":\"WebSocket handshake failed\"}");
        }
    }

    private void handleRestRequest(Socket client, OutputStream out,
                                    byte[] buf, int totalRead,
                                    int bodyStart, String headers) throws IOException {
        byte[] bodyBytes = new byte[totalRead - bodyStart];
        System.arraycopy(buf, bodyStart, bodyBytes, 0, bodyBytes.length);

        int contentLength = parseContentLength(headers);
        int alreadyRead = bodyBytes.length;
        if (contentLength > alreadyRead) {
            byte[] remaining = client.getInputStream().readNBytes(contentLength - alreadyRead);
            byte[] combined = new byte[bodyBytes.length + remaining.length];
            System.arraycopy(bodyBytes, 0, combined, 0, bodyBytes.length);
            System.arraycopy(remaining, 0, combined, bodyBytes.length, remaining.length);
            bodyBytes = combined;
        }

        String requestLine = headers.substring(0, headers.indexOf("\r\n"));
        String[] parts = requestLine.split(" ");
        String method = parts.length > 0 ? parts[0].toUpperCase() : "GET";
        String path   = parts.length > 1 ? parts[1] : "/";
        String body   = new String(bodyBytes, StandardCharsets.UTF_8);

        String responseBody = apiHandler.handle(method, path, body);
        int statusCode = apiHandler.lastStatusCode();
        String contentType = responseBody.startsWith("{") || responseBody.startsWith("[")
            ? "application/json"
            : "text/plain";
        sendHttpResponse(out, statusCode, getStatusText(statusCode), contentType, responseBody);
    }

    private void sendHttpResponse(OutputStream out, int statusCode,
                                   String statusText, String contentType,
                                   String body) throws IOException {
        byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
        String response = "HTTP/1.1 " + statusCode + " " + statusText + "\r\n"
            + "Content-Type: " + contentType + "\r\n"
            + "Content-Length: " + bodyBytes.length + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n"
            + "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
            + "Access-Control-Allow-Headers: Content-Type\r\n"
            + "Connection: close\r\n"
            + "\r\n";
        out.write(response.getBytes(StandardCharsets.US_ASCII));
        out.write(bodyBytes);
        out.flush();
    }

    private int parseContentLength(String headers) {
        for (String line : headers.split("\r\n")) {
            if (line.toLowerCase().startsWith("content-length:")) {
                try {
                    return Integer.parseInt(line.substring(15).trim());
                } catch (NumberFormatException e) {
                    return 0;
                }
            }
        }
        return 0;
    }

    private String getStatusText(int code) {
        return switch (code) {
            case 200 -> "OK";
            case 201 -> "Created";
            case 204 -> "No Content";
            case 400 -> "Bad Request";
            case 404 -> "Not Found";
            case 405 -> "Method Not Allowed";
            case 500 -> "Internal Server Error";
            default -> "Unknown";
        };
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/AppServer.java
git commit -m "feat(filial-java): add AppServer (HTTP + WebSocket single-port)"
```

---

### Task 7: FilialMain.java — wire everything together

**Files:**
- Modify: `applications/filial-java/src/filial/FilialMain.java`

- [ ] **Step 1: Update FilialMain.java**

```java
package filial;

import shared.Env;

/**
 * Entry point for the Filial (branch) application.
 *
 * <p>Initialises all components:
 * <ol>
 *   <li>Loads configuration</li>
 *   <li>Starts the UDP server for Matriz communication</li>
 *   <li>Creates DeviceBridge + ApiHandler for GUI WebSocket</li>
 *   <li>Starts the HTTP + WebSocket server (REST API + GUI connections)</li>
 *   <li>Blocks indefinitely</li>
 * </ol>
 */
public class FilialMain {

    private static final String DEFAULT_CONFIG = "config/config_filial.json";

    public static void main(String[] args) {
        Env.load();

        String configPath = args.length > 0 ? args[0] : DEFAULT_CONFIG;
        int envPort = Env.getInt("FILIAL_UDP_PORT", -1);
        int envHttpPort = Env.getInt("FILIAL_HTTP_PORT", -1);

        System.out.println("=== Filial IoT (Java) ===");
        System.out.println("Config: " + configPath);

        // 1. Load config
        ConfigManager cfgMgr = new ConfigManager();
        if (!cfgMgr.load(configPath)) {
            System.err.println("FATAL: Could not load config from " + configPath);
            System.exit(1);
        }
        FilialConfig cfg = cfgMgr.getConfig();

        int udpPort = (envPort > 0) ? envPort : cfg.port();
        int httpPort = (envHttpPort > 0) ? envHttpPort : cfg.httpPort();

        System.out.println("UDP port: " + udpPort + (envPort > 0 ? " (via .env)" : ""));
        System.out.println("HTTP/WS port: " + httpPort + (envHttpPort > 0 ? " (via .env)" : ""));
        System.out.println("Devices: " + cfg.deviceIds().size());

        // 2. Initialise device manager
        DeviceManager devMgr = new DeviceManager();
        devMgr.init(cfg.deviceIds());
        System.out.println("Initialised " + devMgr.count() + " devices");

        // 3. Create bridge and API handler
        DeviceBridge deviceBridge = new DeviceBridge(devMgr, cfgMgr);
        ApiHandler apiHandler = new ApiHandler(devMgr, deviceBridge);

        // 4. Start HTTP + WebSocket server
        AppServer appServer = new AppServer(httpPort, deviceBridge, apiHandler);
        if (!appServer.start()) {
            System.err.println("FATAL: Could not start HTTP/WS server on port " + httpPort);
            System.exit(1);
        }
        System.out.println("  REST API: http://localhost:" + httpPort + "/api/devices");
        System.out.println("  WebSocket: ws://localhost:" + httpPort + "/ws");
        System.out.println("  Health:   http://localhost:" + httpPort + "/health");

        // 5. Start UDP server for Matriz
        CommandProcessor processor = new CommandProcessor(devMgr, cfg.adminUser(), cfg.adminPass());
        UdpServer udpServer = new UdpServer(udpPort, processor);

        if (!udpServer.start()) {
            System.err.println("FATAL: Could not bind UDP port " + udpPort);
            System.exit(1);
        }

        System.out.println("Listening on UDP port " + udpPort);
        System.out.println("Ready. Press Ctrl+C to stop.");

        // 6. Shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nShutting down...");
            appServer.stop();
            udpServer.stop();
        }));

        // 7. Keep alive
        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

Key change: AppServer starts BEFORE UdpServer (no functional dependency, but AppServer is the new primary interface).

- [ ] **Step 2: Commit**

```bash
git add apps/udp-iot/applications/filial-java/src/filial/FilialMain.java
git commit -m "feat(filial-java): wire AppServer + DeviceBridge into main"
```

---

### Task 8: Config file — add http_port

**Files:**
- Modify: `applications/filial-java/config/config_filial.json`

- [ ] **Step 1: Update config_filial.json**

```json
{
  "port": 51000,
  "http_port": 8082,
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
git add apps/udp-iot/applications/filial-java/config/config_filial.json
git commit -m "chore(filial-java): add http_port to config"
```

---

### Task 9: filial-gui — simplify to pure React frontend

**Files:**
- Modify: `applications/filial-gui/src/hooks/useFilial.ts`
- Modify: `apps/udp-iot/.env`
- Modify: `apps/udp-iot/.env.example`
- Delete: `applications/filial-gui/server/` (directory)

- [ ] **Step 1: Update useFilial.ts default ports**

In `applications/filial-gui/src/hooks/useFilial.ts`, change the default port from 3002 to 8082:

```typescript
const FILIAL_GUI_PORT = import.meta.env.VITE_FILIAL_GUI_PORT || "8082";
```

The rest of the hook stays the same — it already uses `VITE_FILIAL_API_URL` and `VITE_FILIAL_WS_URL` env vars.

- [ ] **Step 2: Update .env and .env.example**

In `apps/udp-iot/.env`, update the filial URLs:
```
VITE_FILIAL_API_URL=http://localhost:8082
VITE_FILIAL_WS_URL=ws://localhost:8082/ws
# FILIAL_GUI_PORT is no longer a Node.js server port, it's the Java HTTP port
```

Also add `FILIAL_HTTP_PORT` for the Java env:
```
FILIAL_HTTP_PORT=8082
```

Apply same to `.env.example`.

- [ ] **Step 3: Remove server/ directory**

```bash
rm -rf apps/udp-iot/applications/filial-gui/server/
```

- [ ] **Step 4: Remove Node server dependencies from package.json (if any)**

Check `apps/udp-iot/applications/filial-gui/package.json` for `express`, `cors`, `ws`, `@types/*` server deps. As of the current state, these are not in package.json (the server/ directory used their own `node_modules` or were compiled separately). If they exist, remove them.

- [ ] **Step 5: Verify the build still works**

```bash
cd apps/udp-iot/applications/filial-gui && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/udp-iot/applications/filial-gui/ apps/udp-iot/.env apps/udp-iot/.env.example
git commit -m "refactor(filial-gui): simplify to pure React frontend, point to Java WS"
```

---

### Task 10: Verify compilation

- [ ] **Step 1: Compile filial-java**

```bash
cd apps/udp-iot/applications/filial-java && javac \
  -d dist \
  -cp ../../packages/udp-shared/src \
  src/filial/*.java
```

Expected: compiles without errors.

- [ ] **Step 2: Verify filial-gui typecheck**

```bash
cd apps/udp-iot/applications/filial-gui && npm run typecheck
```

Expected: passes without errors (no server/ directory means no missing imports).
