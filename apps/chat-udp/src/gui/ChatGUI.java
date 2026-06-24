package gui;

import java.awt.BorderLayout;
import java.io.IOException;
import javax.swing.BorderFactory;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;

import lib.logging.Logger;
import network.MulticastChatManager;

@SuppressWarnings("serial")
public class ChatGUI extends JFrame {

	private static final Logger logger = Logger.getLogger(ChatGUI.class);

	private final ConnectionPanel connPanel = new ConnectionPanel();
	private final MessageArea messageArea = new MessageArea();
	private final SendBar sendBar = new SendBar();

	private final MulticastChatManager chatManager = new MulticastChatManager(this);

	private String currentGroup;
	private int currentPort;

	public ChatGUI() {
		super("UDP Chat — Multicast");
		buildUI();
		registerListeners();
		connPanel.setConnected(false);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setSize(560, 420);
		setLocationRelativeTo(null);
	}

	private void buildUI() {
		setLayout(new BorderLayout(6, 6));
		add(connPanel, BorderLayout.NORTH);
		add(messageArea, BorderLayout.CENTER);
		add(sendBar, BorderLayout.SOUTH);
		((JComponent) getContentPane()).setBorder(
				BorderFactory.createEmptyBorder(6, 6, 6, 6));
	}

	private void registerListeners() {
		connPanel.onToggle(this::doToggle);
		sendBar.onSend(this::doSend);
	}

	private void doToggle() {
		if (connPanel.isConnected()) {
			doDisconnect();
		} else {
			doJoin();
		}
	}

	private void doJoin() {
		String username = connPanel.getUsername();
		if (username.isEmpty()) {
			showError("Informe um nome de usuário.");
			connPanel.requestUsernameFocus();
			return;
		}

		String group = connPanel.getGroup();
		if (group.isEmpty()) {
			showError("Informe um endereço de grupo multicast.");
			return;
		}

		int port;
		try {
			port = Integer.parseInt(connPanel.getPortText());
			if (port < 1 || port > 65535)
				throw new NumberFormatException();
		} catch (NumberFormatException e) {
			showError("Porta inválida (1-65535).");
			return;
		}

		logger.info("Solicitando conexão ao grupo {}:{} como {}", group, port, username);

		try {
			chatManager.joinGroup(group, port, username);
			currentGroup = group;
			currentPort = port;
			connPanel.setConnected(true);
			sendBar.setSendEnabled(true);
			logger.info("Conexão estabelecida com sucesso");
			appendMessage(">>> Entrou no grupo " + group + ":" + port
					+ " como " + username);
		} catch (IOException e) {
			logger.error("Falha ao conectar: {}", e.getMessage());
			showError("Erro ao entrar no grupo: " + e.getMessage());
		}
	}

	private void doDisconnect() {
		logger.info("Solicitando desconexão");
		chatManager.leaveGroup();
		connPanel.setConnected(false);
		sendBar.setSendEnabled(false);
		logger.info("Desconexão concluída");
		appendMessage(">>> Desconectou do grupo " + currentGroup + ":" + currentPort);
	}

	private void doSend() {
		String msg = sendBar.getText();
		if (msg.isEmpty())
			return;

		try {
			chatManager.sendMessage(msg);
			sendBar.clearText();
		} catch (IOException e) {
			logger.error("Falha ao enviar mensagem: {}", e.getMessage());
			showError("Erro ao enviar: " + e.getMessage());
		}
	}

	public void appendMessage(String text) {
		messageArea.append(text);
	}

	private void showError(String msg) {
		SwingUtilities.invokeLater(() -> JOptionPane.showMessageDialog(this, msg, "Erro",
				JOptionPane.ERROR_MESSAGE));
	}
}
