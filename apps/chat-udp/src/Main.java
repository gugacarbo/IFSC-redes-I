import gui.ChatGUI;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.UnsupportedLookAndFeelException;

public class Main {
	public static void main(String[] args) {
		SwingUtilities.invokeLater(() -> {
			try {
				UIManager.setLookAndFeel(
						UIManager.getSystemLookAndFeelClassName());
			} catch (ClassNotFoundException | IllegalAccessException | InstantiationException
					| UnsupportedLookAndFeelException ignored) {
			}
			new ChatGUI().setVisible(true);
		});
	}
}
