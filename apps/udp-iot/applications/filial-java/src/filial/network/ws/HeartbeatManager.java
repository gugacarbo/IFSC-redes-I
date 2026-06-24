package filial.network.ws;

import java.io.IOException;
import java.io.OutputStream;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class HeartbeatManager {

    private final OutputStream out;
    private final String remoteAddr;
    private final AtomicBoolean isOpen;
    private ScheduledExecutorService executor;

    public HeartbeatManager(OutputStream out, String remoteAddr, AtomicBoolean isOpen) {
        this.out = out;
        this.remoteAddr = remoteAddr;
        this.isOpen = isOpen;
    }

    public void start() {
        executor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "ws-ping-" + remoteAddr);
            t.setDaemon(true);
            return t;
        });
        executor.scheduleAtFixedRate(() -> {
            try { sendPing(); } catch (Exception ignored) {}
        }, 30, 30, TimeUnit.SECONDS);
    }

    public void shutdown() {
        if (executor != null) {
            executor.shutdownNow();
        }
    }

    public void sendPong(byte[] payload) throws IOException {
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

    private void sendPing() throws IOException {
        synchronized (this) {
            if (!isOpen.get()) return;
            out.write(0x89);
            out.write(0);
            out.flush();
        }
    }
}
