package filial.gui.panel;

import filial.gui.theme.UiTheme;

import java.awt.BorderLayout;
import java.awt.Font;

import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

public class HeaderPanelBuilder {

    public static JPanel createHeaderPanel(String host, int port) {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(UiTheme.BG_COLOR);
        panel.setBorder(new EmptyBorder(0, 0, 10, 0));

        JPanel leftPanel = new JPanel(new java.awt.FlowLayout(java.awt.FlowLayout.LEFT, 5, 0));
        leftPanel.setBackground(UiTheme.BG_COLOR);

        JLabel icon = new JLabel("\uD83C\uDFE2  ");
        icon.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 28));
        icon.setForeground(UiTheme.TEXT_COLOR);
        leftPanel.add(icon);

        JLabel title = new JLabel("Filial IoT Simulator");
        title.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 22));
        title.setForeground(UiTheme.ACCENT_COLOR);
        leftPanel.add(title);

        panel.add(leftPanel, BorderLayout.WEST);

        JPanel rightPanel = new JPanel(new java.awt.FlowLayout(java.awt.FlowLayout.RIGHT, 10, 5));
        rightPanel.setBackground(UiTheme.BG_COLOR);

        JLabel addrLabel = new JLabel(host + ":" + port);
        addrLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
        addrLabel.setForeground(UiTheme.LABEL_COLOR);
        rightPanel.add(addrLabel);

        JLabel status = new JLabel("\u25CF Conectado");
        status.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
        status.setForeground(UiTheme.SUCCESS_COLOR);
        rightPanel.add(status);

        panel.add(rightPanel, BorderLayout.EAST);

        return panel;
    }

    private HeaderPanelBuilder() {}
}
