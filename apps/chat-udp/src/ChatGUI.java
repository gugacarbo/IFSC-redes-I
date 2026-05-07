import javax.swing.*;
import javax.swing.text.DefaultCaret;
import java.awt.*;
import java.io.IOException;

/**
 * Main application window for the UDP Multicast Chat.
 * <p>
 * Composed of a {@link ConnectionPanel} (top), a scrollable message
 * area (center), and a send bar (bottom).
 */
@SuppressWarnings("serial")
public class ChatGUI extends JFrame {

    private final ConnectionPanel connPanel = new ConnectionPanel();

    private final JTextArea  txtMessages = new JTextArea();
    private final JTextField txtMessage  = new JTextField();
    private final JButton    btnSend     = new JButton("Enviar");

    private final MulticastChatManager chatManager = new MulticastChatManager(this);

    private String currentGroup;
    private int    currentPort;

    // ------------------------------------------------------------------
    //  Constructor
    // ------------------------------------------------------------------

    public ChatGUI() {
        super("UDP Chat — Multicast");
        buildUI();
        registerListeners();
        connPanel.setConnected(false);

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(560, 420);
        setLocationRelativeTo(null);
    }

    // ------------------------------------------------------------------
    //  Layout
    // ------------------------------------------------------------------

    private void buildUI() {
        setLayout(new BorderLayout(6, 6));

        // ---- top: connection panel ----
        add(connPanel, BorderLayout.NORTH);

        // ---- center: message area ----
        txtMessages.setEditable(false);
        txtMessages.setFont(new Font("Consolas", Font.PLAIN, 13));
        DefaultCaret caret = (DefaultCaret) txtMessages.getCaret();
        caret.setUpdatePolicy(DefaultCaret.ALWAYS_UPDATE);
        JScrollPane scroll = new JScrollPane(txtMessages);

        // ---- bottom: send bar ----
        JPanel bottom = new JPanel(new BorderLayout(6, 6));
        bottom.add(txtMessage, BorderLayout.CENTER);
        bottom.add(btnSend, BorderLayout.EAST);

        add(scroll, BorderLayout.CENTER);
        add(bottom, BorderLayout.SOUTH);

        ((JComponent) getContentPane()).setBorder(
                BorderFactory.createEmptyBorder(6, 6, 6, 6));
    }

    // ------------------------------------------------------------------
    //  Listeners
    // ------------------------------------------------------------------

    private void registerListeners() {
        connPanel.onToggle(this::doToggle);
        btnSend.addActionListener(e -> doSend());
        txtMessage.addActionListener(e -> doSend());
    }

    // ------------------------------------------------------------------
    //  Actions
    // ------------------------------------------------------------------

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
            if (port < 1 || port > 65535) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            showError("Porta inválida (1-65535).");
            return;
        }

        try {
            chatManager.joinGroup(group, port, username);
            currentGroup = group;
            currentPort = port;
            connPanel.setConnected(true);
            updateSendEnabled(true);
            appendMessage(">>> Entrou no grupo " + group + ":" + port
                          + " como " + username);
        } catch (IOException e) {
            showError("Erro ao entrar no grupo: " + e.getMessage());
        }
    }

    private void doDisconnect() {
        chatManager.leaveGroup();
        connPanel.setConnected(false);
        updateSendEnabled(false);
        appendMessage(">>> Desconectou do grupo " + currentGroup + ":" + currentPort);
    }

    private void doSend() {
        String msg = txtMessage.getText().trim();
        if (msg.isEmpty()) return;

        try {
            chatManager.sendMessage(msg);
            txtMessage.setText("");
        } catch (IOException e) {
            showError("Erro ao enviar: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    //  GUI helpers (called from any thread — uses invokeLater)
    // ------------------------------------------------------------------

    public void appendMessage(String text) {
        SwingUtilities.invokeLater(() -> txtMessages.append(text + "\n"));
    }

    private void showError(String msg) {
        SwingUtilities.invokeLater(() ->
                JOptionPane.showMessageDialog(this, msg, "Erro",
                                              JOptionPane.ERROR_MESSAGE));
    }

    private void updateSendEnabled(boolean enabled) {
        txtMessage.setEnabled(enabled);
        btnSend.setEnabled(enabled);
        if (!enabled) txtMessage.setText("");
    }
}
