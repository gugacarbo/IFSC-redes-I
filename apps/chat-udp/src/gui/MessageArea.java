package gui;

import java.awt.Font;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import javax.swing.text.DefaultCaret;

@SuppressWarnings("serial")
public class MessageArea extends JScrollPane {

	private final JTextArea txtMessages = new JTextArea();

	public MessageArea() {
		super();
		txtMessages.setEditable(false);
		txtMessages.setFont(new Font("Consolas", Font.PLAIN, 13));
		DefaultCaret caret = (DefaultCaret) txtMessages.getCaret();
		caret.setUpdatePolicy(DefaultCaret.ALWAYS_UPDATE);
		setViewportView(txtMessages);
	}

	public void append(String text) {
		SwingUtilities.invokeLater(() -> txtMessages.append(text + "\n"));
	}
}
