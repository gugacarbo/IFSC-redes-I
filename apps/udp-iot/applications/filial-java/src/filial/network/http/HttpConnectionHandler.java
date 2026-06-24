package filial.network.http;

import filial.api.ApiHandler;
import filial.bridge.DeviceBridge;
import filial.network.ws.WebSocketHandshake;
import filial.network.ws.WebSocketSession;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class HttpConnectionHandler {

    private static final String UPGRADE_HEADER = "upgrade: websocket";

    private final DeviceBridge deviceBridge;
    private final ApiHandler apiHandler;

    public HttpConnectionHandler(DeviceBridge deviceBridge, ApiHandler apiHandler) {
        this.deviceBridge = deviceBridge;
        this.apiHandler = apiHandler;
    }

    public void handleConnection(Socket client) {
        try {
            client.setSoTimeout(15000);
            InputStream in = client.getInputStream();
            OutputStream out = client.getOutputStream();

            byte[] buf = new byte[8192];
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
        if (WebSocketHandshake.performHandshake(
                new ByteArrayInputStream(buf, 0, totalRead), out)) {
            client.setSoTimeout(0);
            WebSocketSession session = new WebSocketSession(client, in, out);
            session.startHeartbeat();
            deviceBridge.onSessionOpened(session);
            deviceBridge.sessionReadLoop(session);
        } else {
            sendHttpResponse(out, 400, "Bad Request", "application/json",
                "{\"error\":\"WebSocket handshake failed\"}");
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
        sendHttpResponse(out, statusCode, HttpStatusCodes.getStatusText(statusCode), contentType, responseBody);
    }

    private static void sendHttpResponse(OutputStream out, int statusCode,
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
}
