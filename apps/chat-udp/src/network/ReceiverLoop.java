package network;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.MulticastSocket;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import gui.ChatGUI;
import lib.logging.Logger;
import util.JsonHelper;

class ReceiverLoop implements Runnable {

	private static final Logger logger = Logger.getLogger(ReceiverLoop.class);

	private final MulticastSocket socket;
	private final ChatGUI gui;
	private final String username;
	private volatile boolean running;

	ReceiverLoop(MulticastSocket socket, String username, ChatGUI gui) {
		this.socket = socket;
		this.username = username;
		this.gui = gui;
		this.running = true;
	}

	void stop() {
		running = false;
	}

	@Override
	public void run() {
		byte[] buffer = new byte[65535];

		logger.info("Loop de recebimento iniciado");

		while (running && socket != null && !socket.isClosed()) {
			try {
				DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
				socket.receive(packet);

				String json = new String(
						packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8);

				String sender = JsonHelper.extractValue(json, "username");
				if (sender.isEmpty() || sender.equals(username)) {
					logger.debug("Mensagem ignorada (própria ou remetente vazio)");
					continue;
				}

				String message = JsonHelper.extractValue(json, "message");
				String date = JsonHelper.extractValue(json, "date");
				String time = JsonHelper.extractValue(json, "time");
				logger.info("Mensagem recebida de {} em {} {}: {}", sender, date, time, message);

				gui.appendMessage(JsonHelper.formatMessage(date, time, sender, message));

			} catch (SocketException e) {
				if (!running)
					break;
				logger.error("Erro de rede: {}", e.getMessage());
				gui.appendMessage("*** Erro de rede: " + e.getMessage());
			} catch (IOException e) {
				if (running) {
					logger.error("Erro ao receber mensagem: {}", e.getMessage());
					gui.appendMessage("*** Erro ao receber: " + e.getMessage());
				}
			}
		}

		logger.info("Loop de recebimento encerrado");
	}
}
