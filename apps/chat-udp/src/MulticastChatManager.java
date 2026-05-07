import java.io.IOException;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Enumeration;

public class MulticastChatManager {

    private MulticastSocket socket;
    private InetAddress groupAddress;
    private int port;
    private String username;
    private volatile boolean running;
    private Thread receiverThread;
    private final ChatGUI gui;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm:ss");

    public MulticastChatManager(ChatGUI gui) {
        this.gui = gui;
    }

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

    public synchronized void leaveGroup() {
        running = false;

        if (socket != null) {
            try {
                if (groupAddress != null) {
                    NetworkInterface netIf = findMulticastInterface();
                    InetSocketAddress groupSockAddr =
                        new InetSocketAddress(groupAddress, port);
                    socket.leaveGroup(groupSockAddr, netIf);
                }
            } catch (IOException ignored) { }
            socket.close();
            socket = null;
        }

        groupAddress = null;

        if (receiverThread != null) {
            receiverThread.interrupt();
            receiverThread = null;
        }
    }

    public synchronized void sendMessage(String message) throws IOException {
        if (socket == null || socket.isClosed() || groupAddress == null) {
            return;
        }

        LocalDate now = LocalDate.now();
        String date = now.format(DATE_FMT);
        String time = LocalTime.now().format(TIME_FMT);

        String json = String.format(
            "{\"date\":\"%s\",\"time\":\"%s\",\"username\":\"%s\",\"message\":\"%s\"}",
            escapeJson(date), escapeJson(time),
            escapeJson(username), escapeJson(message)
        );

        byte[] buf = json.getBytes(StandardCharsets.UTF_8);
        DatagramPacket packet = new DatagramPacket(buf, buf.length, groupAddress, port);
        socket.send(packet);

        // display own message immediately
        gui.appendMessage(formatMessage(date, time, username, message));
    }

    private void receiveLoop() {
        byte[] buffer = new byte[65535];

        while (running && socket != null && !socket.isClosed()) {
            try {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet);

                String json = new String(
                    packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8
                );

                String sender = extractJsonValue(json, "username");
                // skip messages sent by ourselves
                if (sender.isEmpty() || sender.equals(username)) {
                    continue;
                }

                String msgDate = extractJsonValue(json, "date");
                String msgTime = extractJsonValue(json, "time");
                String msgText  = extractJsonValue(json, "message");

                gui.appendMessage(formatMessage(msgDate, msgTime, sender, msgText));

            } catch (SocketException e) {
                if (!running) break; // socket closed on purpose
                gui.appendMessage("*** Erro de rede: " + e.getMessage());
            } catch (IOException e) {
                if (running) {
                    gui.appendMessage("*** Erro ao receber: " + e.getMessage());
                }
            }
        }
    }

    // --- JSON helpers ---------------------------------------------------

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String extractJsonValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return "";
        start += search.length();

        StringBuilder value = new StringBuilder();
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '\\' && i + 1 < json.length()) {
                char next = json.charAt(++i);
                switch (next) {
                    case '"'  -> value.append('"');
                    case '\\' -> value.append('\\');
                    case 'n'  -> value.append('\n');
                    case 'r'  -> value.append('\r');
                    case 't'  -> value.append('\t');
                    default   -> value.append(c).append(next);
                }
            } else if (c == '"') {
                break;
            } else {
                value.append(c);
            }
        }
        return value.toString();
    }

    // --- display helper -------------------------------------------------

    private static String formatMessage(String date, String time,
                                         String user, String msg) {
        return String.format("[%s %s] %s: %s", date, time, user, msg);
    }

    // --- network interface helper ----------------------------------------

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
