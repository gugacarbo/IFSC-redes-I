package matriz;
import lib.logging.Logger;

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
 * and graceful close. Used by {@link HttpServer} for each
 * connected GUI client.
 *
 * <p>This implementation uses raw {@link Socket} I/O — no
 * external WebSocket library required.
 */
public class WebSocketSession {

    private static final Logger logger = Logger.getLogger(WebSocketSession.class);

    private final Socket socket;
    private final InputStream  in;
    private final OutputStream out;
    private final AtomicBoolean open = new AtomicBoolean(true);
    private final String remoteAddr;

    private static final int OPCODE_TEXT   = 0x1;
    private static final int OPCODE_CLOSE  = 0x8;
    private static final int OPCODE_PING   = 0x9;
    private static final int OPCODE_PONG   = 0xA;

    /**
     * Create a session from an already-connected socket.
     * The caller must have already accepted the TCP connection.
     *
     * @param socket the accepted TCP socket (post-handshake for WS)
     * @param inputStream  input stream from the socket
     * @param outputStream output stream to the socket
     */
    public WebSocketSession(Socket socket, InputStream inputStream, OutputStream outputStream) {
        this.socket = socket;
        this.in = inputStream;
        this.out = outputStream;
        this.remoteAddr = socket.getInetAddress().getHostAddress() + ":" + socket.getPort();
    }

    /** Remote address for logging. */
    public String remoteAddress() { return remoteAddr; }

    /** Check if the session is still open. */
    public boolean isOpen() { return open.get() && !socket.isClosed(); }

    /**
     * Send a text frame to the client.
     * @param text the payload (UTF-8)
     * @throws IOException if the write fails
     */
    public synchronized void sendText(String text) throws IOException {
        if (!isOpen()) return;

        byte[] payload = text.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        int len = payload.length;

        // Frame header (server -> client: unmasked)
        out.write(0x81); // FIN + Text opcode

        // Payload length encoding
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

    /**
     * Read the next frame from the client (blocking).
     * Returns the decoded text payload, or null if the connection closed.
     */
    public String readFrame() throws IOException {
        if (!isOpen()) return null;

        // First 2 bytes
        int b1 = in.read();
        if (b1 == -1) { close(); return null; }
        int b2 = in.read();
        if (b2 == -1) { close(); return null; }

        boolean masked = (b2 & 0x80) != 0;
        int len = b2 & 0x7F;

        // Extended payload length
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

        // Masking key (if masked)
        byte[] mask = null;
        if (masked) {
            mask = new byte[4];
            int read = in.readNBytes(mask, 0, 4);
            if (read < 4) { close(); return null; }
        }

        // Payload
        byte[] payload = new byte[len];
        int totalRead = 0;
        while (totalRead < len) {
            int n = in.read(payload, totalRead, len - totalRead);
            if (n == -1) { close(); return null; }
            totalRead += n;
        }

        // Unmask if needed
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
                yield null; // don't return, keep reading
            }
            case OPCODE_PONG -> null; // ignore pong
            default -> {
                logger.warn("WebSocket: Unknown opcode {}", opcode);
                yield null;
            }
        };
    }

    /** Perform the HTTP WebSocket upgrade handshake. */
    public static boolean performHandshake(InputStream in, OutputStream out) throws IOException {
        // Read the HTTP request
        StringBuilder request = new StringBuilder();
        int ch;
        while ((ch = in.read()) != -1) {
            request.append((char) ch);
            if (request.toString().endsWith("\r\n\r\n")) break;
        }

        String reqStr = request.toString();
        if (reqStr.isEmpty()) return false;

        // Extract Sec-WebSocket-Key
        String keyPrefix = "Sec-WebSocket-Key: ";
        int keyStart = reqStr.indexOf(keyPrefix);
        if (keyStart == -1) return false;
        keyStart += keyPrefix.length();
        int keyEnd = reqStr.indexOf("\r\n", keyStart);
        if (keyEnd == -1) return false;
        String key = reqStr.substring(keyStart, keyEnd).trim();

        // Compute accept key
        String acceptKey;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            md.update(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            md.update("258EAFA5-E914-47DA-95CA-C5AB0DC85B11".getBytes(java.nio.charset.StandardCharsets.UTF_8));
            acceptKey = Base64.getEncoder().encodeToString(md.digest());
        } catch (NoSuchAlgorithmException e) {
            return false;
        }

        // Send 101 Switching Protocols
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

    /** Send a Pong frame in response to Ping. */
    private void sendPong(byte[] payload) throws IOException {
        synchronized (this) {
            out.write(0x8A); // FIN + Pong opcode
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

    /** Close the WebSocket connection gracefully. */
    public void close() {
        if (!open.compareAndSet(true, false)) return;
        try {
            // Send close frame
            synchronized (this) {
                if (!socket.isClosed()) {
                    out.write(0x88); // FIN + Close opcode
                    out.write(0);
                    out.flush();
                }
            }
        } catch (Exception ignored) {}
        try { socket.close(); } catch (Exception ignored) {}
    }
}
