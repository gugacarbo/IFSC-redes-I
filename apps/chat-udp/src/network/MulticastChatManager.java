package network;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;

import gui.ChatGUI;
import lib.logging.Logger;
import util.JsonHelper;

public class MulticastChatManager {

	private static final Logger logger = Logger.getLogger(MulticastChatManager.class);

	private MulticastSocket socket;
	private InetAddress groupAddress;
	private int port;
	private String username;
	private volatile boolean running;
	private ReceiverLoop receiver;
	private Thread receiverThread;
	private final ChatGUI gui;

	public MulticastChatManager(ChatGUI gui) {
		this.gui = gui;
	}

	public synchronized void joinGroup(String groupIp, int port, String username)
			throws IOException {
		leaveGroup();

		this.port = port;
		this.username = username;

		logger.info("Tentando conectar ao grupo {}:{}", groupIp, port);

		try {
			socket = new MulticastSocket(port);
			socket.setReuseAddress(true);
			groupAddress = InetAddress.getByName(groupIp);

			NetworkInterface netIf = findMulticastInterface();
			InetSocketAddress groupSockAddr = new InetSocketAddress(groupAddress, port);
			socket.joinGroup(groupSockAddr, netIf);

			logger.info("Conectado com sucesso ao grupo {}:{} como {}", groupIp, port, username);

			running = true;
			receiver = new ReceiverLoop(socket, username, gui);
			receiverThread = new Thread(receiver, "udp-receiver");
			receiverThread.setDaemon(true);
			receiverThread.start();
		} catch (IOException e) {
			logger.error("Falha ao conectar ao grupo {}:{}: {}", groupIp, port, e.getMessage());
			throw e;
		}
	}

	public synchronized void leaveGroup() {
		running = false;

		if (receiver != null) {
			receiver.stop();
			receiver = null;
		}

		if (socket != null) {
			logger.info("Desconectando do grupo {}:{}", groupAddress, port);
			try {
				if (groupAddress != null) {
					NetworkInterface netIf = findMulticastInterface();
					InetSocketAddress groupSockAddr = new InetSocketAddress(groupAddress, port);
					socket.leaveGroup(groupSockAddr, netIf);
				}
				logger.info("Desconectado com sucesso do grupo {}:{}", groupAddress, port);
			} catch (IOException e) {
				logger.warn("Erro ao sair do grupo (ignorado): {}", e.getMessage());
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

	public synchronized void sendMessage(String message) throws IOException {
		if (socket == null || socket.isClosed() || groupAddress == null) {
			return;
		}

		String json = JsonHelper.buildMessage(username, message);

		byte[] buf = json.getBytes(StandardCharsets.UTF_8);
		DatagramPacket packet = new DatagramPacket(buf, buf.length, groupAddress, port);
		socket.send(packet);

		logger.info("Mensagem enviada para {}:{}", groupAddress, port);

		gui.appendMessage(JsonHelper.formatMessage(
				JsonHelper.extractValue(json, "date"),
				JsonHelper.extractValue(json, "time"),
				JsonHelper.extractValue(json, "username"),
				JsonHelper.extractValue(json, "message")));
	}

	public synchronized boolean isConnected() {
		return socket != null && !socket.isClosed() && groupAddress != null && running;
	}

	private static NetworkInterface findMulticastInterface() throws IOException {
		Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
		while (interfaces.hasMoreElements()) {
			NetworkInterface ni = interfaces.nextElement();
			if (ni.isUp() && !ni.isLoopback() && ni.supportsMulticast()) {
				return ni;
			}
		}
		return NetworkInterface.getNetworkInterfaces().nextElement();
	}
}
