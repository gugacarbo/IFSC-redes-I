package matriz;
import lib.logging.Logger;

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
 * upgraded to WebSocket and registered with {@link BridgeManager}; otherwise
 * it is treated as an HTTP REST request and routed to {@link ApiHandler}.
 *
 * <p>Replaces the original two-socket approach that caused port conflicts.
 * Mirrors the ESP32's single-port architecture (AsyncWebServer on port 80).
 */
public class AppServer {

    private static final Logger logger = Logger.getLogger(AppServer.class);

    private final int port;
    private final BridgeManager bridgeManager;
    private final ApiHandler apiHandler;

    private ServerSocket serverSocket;
    private Thread acceptThread;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private ExecutorService connectionPool;

    private static final String UPGRADE_HEADER = "upgrade: websocket";
    private static final int BUFFER_SIZE = 8192;

    public AppServer(int port, BridgeManager bridgeManager, ApiHandler apiHandler) {
        this.port = port;
        this.bridgeManager = bridgeManager;
        this.apiHandler = apiHandler;
    }

    /**
     * Start the server. Binds to the configured port and begins accepting
     * both REST and WebSocket connections.
     * @return true if the server started successfully
     */
    public boolean start() {
        if (running.get()) return true;

        connectionPool = Executors.newCachedThreadPool();

        try {
            serverSocket = new ServerSocket(port);
            serverSocket.setReuseAddress(true);
            running.set(true);
        } catch (IOException e) {
            logger.error("AppServer: Failed to bind port {}: {}", port, e.getMessage());
            return false;
        }

        acceptThread = new Thread(this::acceptLoop, "app-server-accept");
        acceptThread.setDaemon(true);
        acceptThread.start();

        logger.info("AppServer: Listening on port {} (REST + WebSocket)", port);
        return true;
    }

    /** Stop the server gracefully. */
    public void stop() {
        running.set(false);
        if (serverSocket != null && !serverSocket.isClosed()) {
            try { serverSocket.close(); } catch (IOException ignored) {}
        }
        if (connectionPool != null) connectionPool.shutdownNow();
    }

    // ---- Accept loop ----

    private void acceptLoop() {
        while (running.get()) {
            try {
                Socket client = serverSocket.accept();
                connectionPool.submit(() -> handleConnection(client));
            } catch (java.net.SocketException e) {
                if (!running.get()) break; // normal shutdown
                logger.error("AppServer: Accept error: {}", e.getMessage());
            } catch (IOException e) {
                if (running.get()) {
                    logger.error("AppServer: Accept error: {}", e.getMessage());
                }
            }
        }
    }

    // ---- Connection handler ----

    /**
     * Read the full HTTP request headers from a connection and decide
     * whether it's a WebSocket upgrade or a REST API call.
     */
    private void handleConnection(Socket client) {
        try {
            client.setSoTimeout(15000);
            InputStream in = client.getInputStream();
            OutputStream out = client.getOutputStream();

            // Read until we have the full HTTP headers (\r\n\r\n)
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

                // Headers complete?
                int headerEnd = headerSection.indexOf("\r\n\r\n");
                if (headerEnd == -1) continue; // keep reading

                // Headers are complete — split headers from body
                String headers = headerSection.substring(0, headerEnd);
                int bodyStart = headerEnd + 4;

                // Determine if WebSocket upgrade
                if (headers.toLowerCase().contains(UPGRADE_HEADER)) {
                    // ---- WebSocket ----
                    handleWebSocketUpgrade(client, in, out, buf, totalRead, headers);
                    return;
                } else {
                    // ---- REST API ----
                    // Read any remaining body content
                    byte[] bodyBytes = new byte[totalRead - bodyStart];
                    System.arraycopy(buf, bodyStart, bodyBytes, 0, bodyBytes.length);

                    // If Content-Length says more body, read it
                    int contentLength = parseContentLength(headers);
                    int alreadyRead = bodyBytes.length;
                    if (contentLength > alreadyRead) {
                        byte[] remaining = in.readNBytes(contentLength - alreadyRead);
                        byte[] combined = new byte[bodyBytes.length + remaining.length];
                        System.arraycopy(bodyBytes, 0, combined, 0, bodyBytes.length);
                        System.arraycopy(remaining, 0, combined, bodyBytes.length, remaining.length);
                        bodyBytes = combined;
                    }

                    String body = new String(bodyBytes, StandardCharsets.UTF_8);
                    handleRestRequest(client, out, headers, body);
                    return;
                }
            }

            // Buffer full without complete headers — close
            client.close();

        } catch (java.net.SocketTimeoutException e) {
            try { client.close(); } catch (IOException ignored) {}
        } catch (IOException e) {
            try { client.close(); } catch (IOException ignored) {}
        }
    }

    // ---- WebSocket handling ----

    private void handleWebSocketUpgrade(Socket client, InputStream in,
                                         OutputStream out, byte[] buf,
                                         int totalRead, String headers) throws IOException {
        // The full handshake request is in buf (headers only).
        // We must re-feed it through the handshake parser.
        if (WebSocketSession.performHandshake(
                new ByteArrayInputStream(buf, 0, totalRead), out)) {
            // After handshake, any remaining data was already consumed
            WebSocketSession session = new WebSocketSession(client, in, out);
            bridgeManager.onSessionOpened(session);
            bridgeManager.sessionReadLoop(session);
        } else {
            sendHttpResponse(out, 400, "Bad Request", "{\"error\":\"WebSocket handshake failed\"}");
        }
    }

    // ---- REST handling ----

    private void handleRestRequest(Socket client, OutputStream out,
                                    String headers, String body) throws IOException {
        // Parse request line: "GET /api/config HTTP/1.1"
        String requestLine = headers.substring(0, headers.indexOf("\r\n"));
        String[] parts = requestLine.split(" ");
        String method = parts.length > 0 ? parts[0].toUpperCase() : "GET";
        String path   = parts.length > 1 ? parts[1] : "/";

        // Route to ApiHandler
        String responseBody = apiHandler.handle(method, path, body);
        int statusCode = apiHandler.lastStatusCode();

        // Guess content type
        String contentType = responseBody.startsWith("{") || responseBody.startsWith("[")
            ? "application/json"
            : "text/plain";

        sendHttpResponse(out, statusCode, getStatusText(statusCode),
            contentType, responseBody);
    }

    // ---- HTTP response helpers ----

    private void sendHttpResponse(OutputStream out, int statusCode,
                                   String statusText, String body) throws IOException {
        sendHttpResponse(out, statusCode, statusText, "application/json", body);
    }

    private void sendHttpResponse(OutputStream out, int statusCode,
                                   String statusText, String contentType,
                                   String body) throws IOException {
        byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
        String response = "HTTP/1.1 " + statusCode + " " + statusText + "\r\n"
            + "Content-Type: " + contentType + "\r\n"
            + "Content-Length: " + bodyBytes.length + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n"
            + "Access-Control-Allow-Methods: GET, PUT, OPTIONS\r\n"
            + "Access-Control-Allow-Headers: Content-Type\r\n"
            + "Connection: close\r\n"
            + "\r\n";
        out.write(response.getBytes(StandardCharsets.US_ASCII));
        out.write(bodyBytes);
        out.flush();
    }

    // ---- Utility ----

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
            case 204 -> "No Content";
            case 400 -> "Bad Request";
            case 404 -> "Not Found";
            case 405 -> "Method Not Allowed";
            case 500 -> "Internal Server Error";
            default -> "Unknown";
        };
    }
}
