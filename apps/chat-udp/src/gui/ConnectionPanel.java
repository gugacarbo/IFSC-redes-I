package gui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

@SuppressWarnings("serial")
public class ConnectionPanel extends JPanel {

	private static final Color ROSE_500 = new Color(240, 0, 78);
	private static final Color EMERALD_500 = new Color(16, 185, 129);

	private final JTextField txtUsername = new JTextField(12);
	private final JTextField txtGroup = new JTextField("230.0.0.12", 12);
	private final JTextField txtPort = new JTextField("4446", 6);

	private final RoundedButton btnToggle;
	private boolean connected = false;
	private boolean hovering = false;

	public ConnectionPanel() {
		super();
		btnToggle = new RoundedButton("Desconectado", ROSE_500, Color.WHITE);
		build();
	}

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

	private void updateButtonAppearance() {
		if (connected) {
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

	public String getUsername() {
		return txtUsername.getText().trim();
	}

	public String getGroup() {
		return txtGroup.getText().trim();
	}

	public String getPortText() {
		return txtPort.getText().trim();
	}

	public boolean isConnected() {
		return connected;
	}

	public void onToggle(Runnable action) {
		btnToggle.addActionListener(e -> action.run());
	}

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
