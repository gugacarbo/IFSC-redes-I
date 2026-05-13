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
            sendHttpResponse(out, 400, "Bad Request", "application/json", "{\"error\":\"WebSocket handshake failed\"}");
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
