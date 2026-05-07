import javax.swing.*;
import javax.swing.text.DefaultCaret;
import java.awt.*;
import java.io.IOException;

@SuppressWarnings("serial")
public class ChatGUI extends JFrame {

    private final JTextField txtUsername = new JTextField(12);
    private final JTextField txtGroup    = new JTextField("230.0.0.0", 12);
    private final JTextField txtPort     = new JTextField("4446", 6);
    private final JButton    btnJoin     = new JButton("Entrar");
    private final JButton    btnLeave    = new JButton("Sair");
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
        updateUIState(false);

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
        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        top.add(new JLabel("Usuário:"));
        top.add(txtUsername);
        top.add(Box.createHorizontalStrut(8));
        top.add(new JLabel("Grupo:"));
        top.add(txtGroup);
        top.add(Box.createHorizontalStrut(8));
        top.add(new JLabel("Porta:"));
        top.add(txtPort);
        top.add(btnJoin);
        top.add(btnLeave);

        // ---- center: message area ----
        txtMessages.setEditable(false);
        txtMessages.setFont(new Font("Consolas", Font.PLAIN, 13));
        DefaultCaret caret = (DefaultCaret) txtMessages.getCaret();
        caret.setUpdatePolicy(DefaultCaret.ALWAYS_UPDATE);
        JScrollPane scroll = new JScrollPane(txtMessages);

        // ---- bottom: send panel ----
        JPanel bottom = new JPanel(new BorderLayout(6, 6));
        bottom.add(txtMessage, BorderLayout.CENTER);
        bottom.add(btnSend, BorderLayout.EAST);

        // assemble
        add(top,    BorderLayout.NORTH);
        add(scroll, BorderLayout.CENTER);
        add(bottom, BorderLayout.SOUTH);

        ((JComponent) getContentPane()).setBorder(
            BorderFactory.createEmptyBorder(6, 6, 6, 6));
    }

    // ------------------------------------------------------------------
    //  Listeners
    // ------------------------------------------------------------------

    private void registerListeners() {
        btnJoin.addActionListener(e -> doJoin());
        btnLeave.addActionListener(e -> doLeave());
        btnSend.addActionListener(e -> doSend());
        txtMessage.addActionListener(e -> doSend());
    }

    // ------------------------------------------------------------------
    //  Actions
    // ------------------------------------------------------------------

    private void doJoin() {
        String username = txtUsername.getText().trim();
        if (username.isEmpty()) {
            showError("Informe um nome de usuário.");
            return;
        }

        String group = txtGroup.getText().trim();
        if (group.isEmpty()) {
            showError("Informe um endereço de grupo multicast.");
            return;
        }

        int port;
        try {
            port = Integer.parseInt(txtPort.getText().trim());
            if (port < 1 || port > 65535) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            showError("Porta inválida (1-65535).");
            return;
        }

        try {
            chatManager.joinGroup(group, port, username);
            currentGroup = group;
            currentPort  = port;
            updateUIState(true);
            appendMessage(">>> Entrou no grupo " + group + ":" + port
                          + " como " + username);
        } catch (IOException e) {
            showError("Erro ao entrar no grupo: " + e.getMessage());
        }
    }

    private void doLeave() {
        chatManager.leaveGroup();
        updateUIState(false);
        appendMessage(">>> Saiu do grupo " + currentGroup + ":" + currentPort);
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
    //  GUI helpers  (called from any thread — uses invokeLater)
    // ------------------------------------------------------------------

    public void appendMessage(String text) {
        SwingUtilities.invokeLater(() -> txtMessages.append(text + "\n"));
    }

    private void showError(String msg) {
        SwingUtilities.invokeLater(() ->
            JOptionPane.showMessageDialog(this, msg, "Erro",
                                          JOptionPane.ERROR_MESSAGE));
    }

    private void updateUIState(boolean connected) {
        txtUsername.setEnabled(!connected);
        txtGroup.setEnabled(!connected);
        txtPort.setEnabled(!connected);
        btnJoin.setEnabled(!connected);
        btnLeave.setEnabled(connected);
        txtMessage.setEnabled(connected);
        btnSend.setEnabled(connected);
        if (!connected) txtMessage.setText("");
    }

    // ------------------------------------------------------------------
    //  Entry point
    // ------------------------------------------------------------------

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(
                    UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) { }
            new ChatGUI().setVisible(true);
        });
    }
}
