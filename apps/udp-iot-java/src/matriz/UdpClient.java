package matriz;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

/**
 * UDP client for sending commands to filiais and receiving responses.
 *
 * <p>Replaces the UDP sending logic in {@code matriz-esp32/BridgeManager.cpp}.
 * Each call creates a temporary socket (lightweight for request-response).
 */
public class UdpClient {

    private static final int MAX_DATAGRAM_SIZE = 2048;
    private static final int DEFAULT_TIMEOUT_MS = 3000;

    /**
     * Send a JSON payload to a filial via UDP and wait for a response.
     *
     * @param ip        Target IP address
     * @param port      Target UDP port
     * @param json      JSON string payload to send
     * @param timeoutMs Receive timeout in milliseconds
     * @return Response JSON string, or null if timeout/error
     */
    public String sendAndReceive(String ip, int port, String json, int timeoutMs) {
        try (DatagramSocket socket = new DatagramSocket()) {
            socket.setSoTimeout(timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);

            InetAddress addr = InetAddress.getByName(ip);
            byte[] sendData = json.getBytes(StandardCharsets.UTF_8);
            DatagramPacket sendPacket = new DatagramPacket(sendData, sendData.length, addr, port);
            socket.send(sendPacket);

            // Receive response
            byte[] recvBuf = new byte[MAX_DATAGRAM_SIZE];
            DatagramPacket recvPacket = new DatagramPacket(recvBuf, recvBuf.length);
            socket.receive(recvPacket);

            return new String(recvPacket.getData(), 0, recvPacket.getLength(), StandardCharsets.UTF_8);
        } catch (java.net.SocketTimeoutException e) {
            System.err.println("UdpClient: Timeout waiting for response from " + ip + ":" + port);
            return null;
        } catch (Exception e) {
            System.err.println("UdpClient: Error communicating with " + ip + ":" + port + " — " + e.getMessage());
            return null;
        }
    }

    /**
     * Send with default timeout.
     * @see #sendAndReceive(String, int, String, int)
     */
    public String sendAndReceive(String ip, int port, String json) {
        return sendAndReceive(ip, port, json, DEFAULT_TIMEOUT_MS);
    }

    /**
     * Send a JSON payload without waiting for a response (fire-and-forget).
     */
    public void send(String ip, int port, String json) {
        try (DatagramSocket socket = new DatagramSocket()) {
            InetAddress addr = InetAddress.getByName(ip);
            byte[] data = json.getBytes(StandardCharsets.UTF_8);
            DatagramPacket packet = new DatagramPacket(data, data.length, addr, port);
            socket.send(packet);
        } catch (Exception e) {
            System.err.println("UdpClient: Error sending to " + ip + ":" + port + " — " + e.getMessage());
        }
    }
}
