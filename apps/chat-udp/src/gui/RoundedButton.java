package gui;

import java.awt.Color;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import javax.swing.JButton;
import javax.swing.border.EmptyBorder;

@SuppressWarnings("serial")
public class RoundedButton extends JButton {

	private static final int ARC = 16;

	public RoundedButton(String text, Color bg, Color fg) {
		super(text);
		setBackground(bg);
		setForeground(fg);
		setFont(getFont().deriveFont(Font.BOLD, 12f));
		setFocusPainted(false);
		setContentAreaFilled(false);
		setOpaque(false);
		setBorder(new EmptyBorder(4, 14, 4, 14));
		setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
	}

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
}
