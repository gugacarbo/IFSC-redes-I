import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import javax.swing.*;
import javax.swing.border.EmptyBorder;

/**
 * Top panel with connection fields: username, multicast group,
 * port, and a toggle button that shows <b>Desconectado</b> or
 * <b>Conectar</b> depending on connection state, with hover effects.
 */
@SuppressWarnings("serial")
public class ConnectionPanel extends JPanel {

    private static final Color ROSE_500    = new Color(240, 0, 78);
    private static final Color EMERALD_500 = new Color(16, 185, 129);
    private static final int   ARC         = 16;

    private final JTextField txtUsername = new JTextField(12);
    private final JTextField txtGroup    = new JTextField("230.0.0.0", 12);
    private final JTextField txtPort     = new JTextField("4446", 6);

    private final JButton btnToggle;
    private boolean connected = false;
    private boolean hovering = false;

    public ConnectionPanel() {
        super();
        btnToggle = createRoundedButton("Desconectado", ROSE_500, Color.WHITE);
        build();
    }

    /** Creates a button that paints its own rounded background. */
    private static JButton createRoundedButton(String text, Color bg, Color fg) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                                    RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(getBackground());
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), ARC, ARC);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        btn.setBackground(bg);
        btn.setForeground(fg);
        btn.setFont(btn.getFont().deriveFont(Font.BOLD, 12f));
        btn.setFocusPainted(false);
        btn.setContentAreaFilled(false);
        btn.setOpaque(false);
        btn.setBorder(new EmptyBorder(4, 14, 4, 14));
        btn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        return btn;
    }

    // ------------------------------------------------------------------
    //  Layout
    // ------------------------------------------------------------------

    private void build() {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(BorderFactory.createEmptyBorder(8, 6, 8, 6));

        add(new JLabel("Usuário:"));
        add(txtUsername);
        add(Box.createHorizontalStrut(10));

        add(new JLabel("Grupo:"));
        add(txtGroup);
        add(Box.createHorizontalStrut(10));

        add(new JLabel("Porta:"));
        add(txtPort);
        add(Box.createHorizontalStrut(10));
        add(btnToggle);
        add(Box.createHorizontalGlue());

        // ---- mouse listeners for hover effect ----
        btnToggle.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                hovering = true;
                updateButtonAppearance();
            }

            @Override
            public void mouseExited(MouseEvent e) {
                hovering = false;
                updateButtonAppearance();
            }
        });
    }

    /** Update button text, background and foreground based on state and hover. */
    private void updateButtonAppearance() {
        if (connected) {
            // connected → "Conectar" verde (bg verde, fg preto)
            // on hover → "Desconectar" vermelho (bg vermelho, fg branco)
            if (hovering) {
                btnToggle.setText("Desconectar");
                btnToggle.setBackground(ROSE_500);
                btnToggle.setForeground(Color.WHITE);
            } else {
                btnToggle.setText("Conectado");
                btnToggle.setBackground(EMERALD_500);
                btnToggle.setForeground(Color.BLACK);
            }
        } else {
            // disconnected → "Desconectado" vermelho (bg vermelho, fg branco)
            // on hover → "Conectar" verde (bg verde, fg preto)
            if (hovering) {
                btnToggle.setText("Conectar");
                btnToggle.setBackground(EMERALD_500);
                btnToggle.setForeground(Color.BLACK);
            } else {
                btnToggle.setText("Desconectado");
                btnToggle.setBackground(ROSE_500);
                btnToggle.setForeground(Color.WHITE);
            }
        }
    }

    // ------------------------------------------------------------------
    //  Getters
    // ------------------------------------------------------------------

    public String getUsername() { return txtUsername.getText().trim(); }
    public String getGroup()    { return txtGroup.getText().trim(); }
    public String getPortText() { return txtPort.getText().trim(); }
    public boolean isConnected() { return connected; }

    // ------------------------------------------------------------------
    //  Listeners (wired by ChatGUI)
    // ------------------------------------------------------------------

    public void onToggle(Runnable action) {
        btnToggle.addActionListener(e -> action.run());
    }

    // ------------------------------------------------------------------
    //  UI state
    // ------------------------------------------------------------------

    /** Switch between disconnected / connected appearance. */
    public void setConnected(boolean connected) {
        this.connected = connected;
        txtUsername.setEnabled(!connected);
        txtGroup.setEnabled(!connected);
        txtPort.setEnabled(!connected);
        btnToggle.setEnabled(true);
        updateButtonAppearance();
    }

    public void requestUsernameFocus() {
        txtUsername.requestFocusInWindow();
    }
}
