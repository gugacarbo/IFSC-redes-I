package gui;

import java.awt.BorderLayout;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.JTextField;

@SuppressWarnings("serial")
public class SendBar extends JPanel {

	private final JTextField txtMessage = new JTextField();
	private final JButton btnSend = new JButton("Enviar");

	public SendBar() {
		super(new BorderLayout(6, 6));
		add(txtMessage, BorderLayout.CENTER);
		add(btnSend, BorderLayout.EAST);
	}

	public void onSend(Runnable action) {
		btnSend.addActionListener(e -> action.run());
		txtMessage.addActionListener(e -> action.run());
	}

	public String getText() {
		return txtMessage.getText().trim();
	}

	public void clearText() {
		txtMessage.setText("");
	}

	public void setSendEnabled(boolean enabled) {
		txtMessage.setEnabled(enabled);
		btnSend.setEnabled(enabled);
		if (!enabled)
			txtMessage.setText("");
	}
}
