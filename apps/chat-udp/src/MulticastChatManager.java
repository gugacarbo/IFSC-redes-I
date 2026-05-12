import java.io.IOException;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;

/**
 * Manages a multicast UDP chat session: join/leave group,
 * send/receive messages.
 */
public class MulticastChatManager {

    private MulticastSocket socket;
    private InetAddress groupAddress;
    private int port;
    private String username;
    private volatile boolean running;
    private Thread receiverThread;
    private final ChatGUI gui;

    public MulticastChatManager(ChatGUI gui) {
        this.gui = gui;
    }

    /** Join a multicast group. Leaves any previous group first. */
    public synchronized void joinGroup(String groupIp, int port, String username)
            throws IOException {
        leaveGroup();

        this.port = port;
        this.username = username;

        socket = new MulticastSocket(port);
        socket.setReuseAddress(true);
        groupAddress = InetAddress.getByName(groupIp);

        NetworkInterface netIf = findMulticastInterface();
        InetSocketAddress groupSockAddr = new InetSocketAddress(groupAddress, port);
        socket.joinGroup(groupSockAddr, netIf);

        running = true;
        receiverThread = new Thread(this::receiveLoop, "udp-receiver");
        receiverThread.setDaemon(true);
        receiverThread.start();
    }

    /** Leave the current multicast group and close the socket. */
    public synchronized void leaveGroup() {
        running = false;

        if (socket != null) {
            try {
                if (groupAddress != null) {
                    NetworkInterface netIf = findMulticastInterface();
                    InetSocketAddress groupSockAddr = new InetSocketAddress(groupAddress, port);
                    socket.leaveGroup(groupSockAddr, netIf);
                }
            } catch (IOException ignored) {
            }
            socket.close();
            socket = null;
        }

        groupAddress = null;

        if (receiverThread != null) {
            receiverThread.interrupt();
            receiverThread = null;
        }
    }

    /** Send a chat message to the group. */
    public synchronized void sendMessage(String message) throws IOException {
        if (socket == null || socket.isClosed() || groupAddress == null) {
            return;
        }

        String json = JsonHelper.buildMessage(username, message);

        byte[] buf = json.getBytes(StandardCharsets.UTF_8);
        DatagramPacket packet = new DatagramPacket(buf, buf.length, groupAddress, port);
        socket.send(packet);

        // display own message immediately
        gui.appendMessage(jsonToDisplay(json));
    }

    /** Returns true if currently connected to a group. */
    public synchronized boolean isConnected() {
        return socket != null && !socket.isClosed() && groupAddress != null && running;
    }

    // ------------------------------------------------------------------
    // Internal
    // ------------------------------------------------------------------

    private void receiveLoop() {
        byte[] buffer = new byte[65535];

        while (running && socket != null && !socket.isClosed()) {
            try {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet);

                String json = new String(
                        packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8);

                String sender = JsonHelper.extractValue(json, "username");
                // skip messages sent by ourselves
                if (sender.isEmpty() || sender.equals(username)) {
                    continue;
                }

                gui.appendMessage(jsonToDisplay(json));

            } catch (SocketException e) {
                if (!running)
                    break; // socket closed on purpose
                gui.appendMessage("*** Erro de rede: " + e.getMessage());
            } catch (IOException e) {
                if (running) {
                    gui.appendMessage("*** Erro ao receber: " + e.getMessage());
                }
            }
        }
    }

    /** Parse a JSON payload and return the formatted display string. */
    private static String jsonToDisplay(String json) {
        String d = JsonHelper.extractValue(json, "date");
        String t = JsonHelper.extractValue(json, "time");
        String u = JsonHelper.extractValue(json, "username");
        String m = JsonHelper.extractValue(json, "message");
        return JsonHelper.formatMessage(d, t, u, m);
    }

    // --- network interface ---------------------------------------------

    private static NetworkInterface findMulticastInterface() throws IOException {
        Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
        while (interfaces.hasMoreElements()) {
            NetworkInterface ni = interfaces.nextElement();
            if (ni.isUp() && !ni.isLoopback() && ni.supportsMulticast()) {
                return ni;
            }
        }
        // fallback: any interface (even loopback)
        return NetworkInterface.getNetworkInterfaces().nextElement();
    }
}
