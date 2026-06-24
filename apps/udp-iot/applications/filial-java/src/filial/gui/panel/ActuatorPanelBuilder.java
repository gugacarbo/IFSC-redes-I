package filial.gui.panel;

import filial.gui.theme.UiTheme;
import filial.model.DeviceState;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;

import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

public class ActuatorPanelBuilder {

    public static JPanel createActuatorPanel(DeviceState state) {
        JPanel panel = new JPanel(new BorderLayout(10, 0));
        panel.setBackground(UiTheme.PANEL_COLOR);
        panel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 50));
        panel.setAlignmentX(Component.LEFT_ALIGNMENT);

        String icon = state.isLight() ? "\uD83D\uDCA1" : "\u2744\uFE0F";
        JLabel iconLabel = new JLabel(icon + "  ");
        iconLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 20));
        iconLabel.setForeground(UiTheme.TEXT_COLOR);
        panel.add(iconLabel, BorderLayout.WEST);

        JLabel nameLabel = new JLabel(formatDeviceName(state.deviceId()));
        nameLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 14));
        nameLabel.setForeground(UiTheme.TEXT_COLOR);
        panel.add(nameLabel, BorderLayout.CENTER);

        JLabel valueLabel = new JLabel();
        valueLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 16));
        valueLabel.setHorizontalAlignment(SwingConstants.RIGHT);
        updateActuatorValueLabel(valueLabel, state);
        panel.add(valueLabel, BorderLayout.EAST);

        return panel;
    }

    public static void updateActuatorValueLabel(JLabel label, DeviceState state) {
        if (state.isLight()) {
            boolean isOn = state.boolValue();
            label.setText(isOn ? "LIGADO" : "DESLIGADO");
            label.setForeground(isOn ? UiTheme.SUCCESS_COLOR : UiTheme.LABEL_COLOR);
        } else {
            int value = state.intValue();
            int percent = (int) ((value / 1023.0) * 100);
            label.setText(value + " (" + percent + "%)");
            Color color;
            if (percent < 33) color = UiTheme.SUCCESS_COLOR;
            else if (percent < 66) color = UiTheme.WARNING_COLOR;
            else color = new Color(255, 71, 87);
            label.setForeground(color);
        }
    }

    public static String formatDeviceName(String deviceId) {
        String name = deviceId
            .replace("actuator_", "")
            .replace("sensor_", "")
            .replace("_", " ");
        StringBuilder result = new StringBuilder();
        for (String part : name.split(" ")) {
            if (part.length() > 0) {
                result.append(Character.toUpperCase(part.charAt(0)))
                      .append(part.substring(1).toLowerCase())
                      .append(" ");
            }
        }
        return result.toString().trim();
    }
}
