package filial.udp;

import lib.logging.Logger;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.util.concurrent.atomic.AtomicBoolean;

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

    public boolean start() {
        if (running.get()) return true;

        try {
            socket = new DatagramSocket(port);
            socket.setSoTimeout(0);
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

    public void stop() {
        running.set(false);
        if (socket != null && !socket.isClosed()) {
            socket.close();
        }
    }

    public boolean isRunning() {
        return running.get();
    }

    private void receiveLoop() {
        byte[] buffer = new byte[MAX_DATAGRAM_SIZE];
        DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

        while (running.get()) {
            try {
                packet.setLength(buffer.length);
                socket.receive(packet);

                String payload = new String(
                    packet.getData(), 0, packet.getLength(),
                    java.nio.charset.StandardCharsets.UTF_8
                );

                String response = processor.process(payload);

                if (response != null && !response.isEmpty()) {
                    byte[] respBytes = response.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    DatagramPacket respPacket = new DatagramPacket(
                        respBytes, respBytes.length,
                        packet.getAddress(), packet.getPort()
                    );
                    socket.send(respPacket);
                }
            } catch (java.net.SocketException e) {
                if (!running.get()) break;
                logger.error("UdpServer: Socket error: {}", e.getMessage());
            } catch (Exception e) {
                logger.error("UdpServer: Error processing packet: {}", e.getMessage());
            }
        }
    }
}
