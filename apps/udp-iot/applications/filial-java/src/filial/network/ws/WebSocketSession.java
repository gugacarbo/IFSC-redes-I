package filial.network.ws;

import lib.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.concurrent.atomic.AtomicBoolean;

public class WebSocketSession {

    private static final Logger logger = Logger.getLogger(WebSocketSession.class);

    private final Socket socket;
    private final InputStream  in;
    private final OutputStream out;
    private final AtomicBoolean open = new AtomicBoolean(true);
    private final String remoteAddr;
    private final HeartbeatManager heartbeat;

    private static final int OPCODE_TEXT  = 0x1;
    private static final int OPCODE_CLOSE = 0x8;
    private static final int OPCODE_PING  = 0x9;
    private static final int OPCODE_PONG  = 0xA;

    public WebSocketSession(Socket socket, InputStream inputStream, OutputStream outputStream) {
        this.socket = socket;
        this.in = inputStream;
        this.out = outputStream;
        this.remoteAddr = socket.getInetAddress().getHostAddress() + ":" + socket.getPort();
        this.heartbeat = new HeartbeatManager(out, remoteAddr, open);
    }

    public String remoteAddress() { return remoteAddr; }

    public boolean isOpen() { return open.get() && !socket.isClosed(); }

    public synchronized void sendText(String text) throws IOException {
        if (!isOpen()) return;
        byte[] payload = text.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        int len = payload.length;
        out.write(0x81);
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
                heartbeat.sendPong(payload);
                yield null;
            }
            case OPCODE_PONG -> null;
            default -> {
                logger.warn("WebSocket: Unknown opcode {}", opcode);
                yield null;
            }
        };
    }

    public void startHeartbeat() {
        heartbeat.start();
    }

    public void close() {
        if (!open.compareAndSet(true, false)) return;
        heartbeat.shutdown();
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
