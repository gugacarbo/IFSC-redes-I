package filial;

import java.io.IOException;
import lib.logging.Logger;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Manages a single WebSocket connection (RFC 6455).
 *
 * <p>Handles the HTTP Upgrade handshake, frame read/write,
 * and graceful close. No external WebSocket library required.
 */
public class WebSocketSession {

    private static final Logger logger = Logger.getLogger(WebSocketSession.class);

    private final Socket socket;
    private final InputStream  in;
    private final OutputStream out;
    private final AtomicBoolean open = new AtomicBoolean(true);
    private final String remoteAddr;
    private ScheduledExecutorService heartbeatExecutor;

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
                logger.warn("WebSocket: Unknown opcode {}", opcode);
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

    /** Start a 30-second heartbeat sending WebSocket PING frames. */
    public void startHeartbeat() {
        heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "ws-ping-" + remoteAddr);
            t.setDaemon(true);
            return t;
        });
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            try { sendPing(); } catch (Exception ignored) {}
        }, 30, 30, TimeUnit.SECONDS);
    }

    private void sendPing() throws IOException {
        synchronized (this) {
            if (!isOpen()) return;
            out.write(0x89); // FIN + Ping opcode
            out.write(0);    // empty payload
            out.flush();
        }
    }

    public void close() {
        if (!open.compareAndSet(true, false)) return;
        if (heartbeatExecutor != null) {
            heartbeatExecutor.shutdownNow();
        }
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
