package filial;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

/**
 * Custom toggle switch styled like iOS/Material Design switches.
 */
public class SwitchToggle extends JToggleButton {

    private static final int THUMB_SIZE = 20;
    private static final int TRACK_WIDTH = 44;
    private static final int TRACK_HEIGHT = 24;

    private static final Color TRACK_ON = new Color(46, 213, 115);
    private static final Color TRACK_OFF = new Color(100, 110, 120);
    private static final Color THUMB_COLOR = Color.WHITE;
    private static final Color THUMB_BORDER = new Color(160, 165, 170);

    public SwitchToggle() {
        setPreferredSize(new Dimension(TRACK_WIDTH + 4, TRACK_HEIGHT + 4));
        setMinimumSize(new Dimension(TRACK_WIDTH + 4, TRACK_HEIGHT + 4));
        setMaximumSize(new Dimension(TRACK_WIDTH + 4, TRACK_HEIGHT + 4));
        setOpaque(false);
        setCursor(new Cursor(Cursor.HAND_CURSOR));
        setFocusPainted(false);
        setBorderPainted(false);
        setContentAreaFilled(false);
        setBorder(new EmptyBorder(2, 2, 2, 2));
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int x = 2;
        int y = 2;

        g2.setColor(isSelected() ? TRACK_ON : TRACK_OFF);
        g2.fillRoundRect(x, y, TRACK_WIDTH, TRACK_HEIGHT, 12, 12);

        int thumbX = isSelected() ? x + TRACK_WIDTH - THUMB_SIZE : x;
        int thumbY = y + (TRACK_HEIGHT - THUMB_SIZE) / 2;

        g2.setColor(THUMB_COLOR);
        g2.fillOval(thumbX, thumbY, THUMB_SIZE, THUMB_SIZE);

        g2.setColor(THUMB_BORDER);
        g2.drawOval(thumbX, thumbY, THUMB_SIZE, THUMB_SIZE);

        g2.dispose();
    }

    @Override
    public boolean contains(int x, int y) {
        return new Rectangle(0, 0, getWidth(), getHeight()).contains(x, y);
    }
}
