package filial;

import java.net.DatagramPacket;
import lib.logging.Logger;
import java.net.DatagramSocket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * UDP server that listens for incoming commands from the Matriz.
 *
 * <p>Replaces {@code filial-esp32/UdpServer.cpp}.
 * Runs a dedicated receiver thread and delegates processing
 * to {@link CommandProcessor} via a thread pool.
 */
public class UdpServer {

    private static final Logger logger = Logger.getLogger(UdpServer.class);

    private final int port;
    private final CommandProcessor processor;
    private final AtomicBoolean running = new AtomicBoolean(false);

    private DatagramSocket socket;
    private Thread receiverThread;

    private static final int MAX_DATAGRAM_SIZE = 2048;

    public UdpServer(int port, CommandProcessor processor) {
        this.port = port;
        this.processor = processor;
    }

    /**
     * Start the UDP server. Binds to the configured port and
     * begins accepting datagrams.
     * @return true if binding succeeded
     */
    public boolean start() {
        if (running.get()) return true;

        try {
            socket = new DatagramSocket(port);
            socket.setSoTimeout(0); // blocking mode (no timeout)
            running.set(true);
        } catch (Exception e) {
            logger.error("UdpServer: Failed to bind port {}: {}", port, e.getMessage());
            return false;
        }

        receiverThread = new Thread(this::receiveLoop, "udp-server-receiver");
        receiverThread.setDaemon(true);
        receiverThread.start();
        return true;
    }

    /** Stop the server gracefully. */
    public void stop() {
        running.set(false);
        if (socket != null && !socket.isClosed()) {
            socket.close();
        }
    }

    /** Check if the server is currently running. */
    public boolean isRunning() {
        return running.get();
    }

    // ---- Internal ----

    private void receiveLoop() {
        byte[] buffer = new byte[MAX_DATAGRAM_SIZE];
        DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

        while (running.get()) {
            try {
                // Reset packet length for each receive
                packet.setLength(buffer.length);
                socket.receive(packet);

                // Extract payload
                String payload = new String(
                    packet.getData(), 0, packet.getLength(),
                    java.nio.charset.StandardCharsets.UTF_8
                );

                // Process in current thread (lightweight enough for UDP)
                // For heavier workloads, use a thread pool here
                String response = processor.process(payload);

                // Send response back to sender
                if (response != null && !response.isEmpty()) {
                    byte[] respBytes = response.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    DatagramPacket respPacket = new DatagramPacket(
                        respBytes, respBytes.length,
                        packet.getAddress(), packet.getPort()
                    );
                    socket.send(respPacket);
                }
            } catch (java.net.SocketException e) {
                // Socket closed during stop()
                if (!running.get()) break;
                logger.error("UdpServer: Socket error: {}", e.getMessage());
            } catch (Exception e) {
                logger.error("UdpServer: Error processing packet: {}", e.getMessage());
            }
        }
    }
}
