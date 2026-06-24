package filial.gui.panel;

import filial.gui.theme.SwitchToggle;
import filial.gui.theme.UiTheme;
import filial.model.DeviceManager;
import filial.model.DeviceState;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;

import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSlider;
import javax.swing.JToggleButton;
import javax.swing.event.ChangeListener;

public class SensorPanelBuilder {

    public static JPanel createSensorPanel(DeviceState state, DeviceManager deviceManager,
                                            java.util.function.Consumer<String> onSensorChanged) {
        JPanel panel = new JPanel(new BorderLayout(10, 5));
        panel.setBackground(UiTheme.PANEL_COLOR);
        panel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 60));
        panel.setAlignmentX(java.awt.Component.LEFT_ALIGNMENT);

        String icon = state.isLight() ? "\uD83D\uDD06" : "\uD83C\uDF21\uFE0F";
        String deviceType = state.isLight() ? "Luminosidade" : "Temperatura";
        JLabel titleLabel = new JLabel(icon + "  " + ActuatorPanelBuilder.formatDeviceName(state.deviceId()));
        titleLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 14));
        titleLabel.setForeground(UiTheme.TEXT_COLOR);
        panel.add(titleLabel, BorderLayout.WEST);

        JLabel typeLabel = new JLabel(deviceType);
        typeLabel.setFont(new Font(Font.SANS_SERIF, Font.ITALIC, 11));
        typeLabel.setForeground(UiTheme.LABEL_COLOR);
        panel.add(typeLabel, BorderLayout.EAST);

        if (state.isLight()) {
            JToggleButton switchBtn = createSwitch(state, deviceManager, onSensorChanged);
            panel.add(switchBtn, BorderLayout.SOUTH);
        } else {
            JPanel sliderPanel = createAcSliderPanel(state, deviceManager, onSensorChanged);
            panel.add(sliderPanel, BorderLayout.SOUTH);
        }

        return panel;
    }

    public static SwitchToggle createSwitch(DeviceState state, DeviceManager deviceManager,
                                             java.util.function.Consumer<String> onSensorChanged) {
        SwitchToggle toggle = new SwitchToggle();
        toggle.setSelected(state.boolValue());

        final String sensorId = state.deviceId();
        toggle.addItemListener(e -> {
            try {
                deviceManager.set(sensorId, toggle.isSelected());
                if (onSensorChanged != null) onSensorChanged.accept(sensorId);
            } catch (IllegalArgumentException ex) {
            }
        });

        return toggle;
    }

    public static JPanel createAcSliderPanel(DeviceState state, DeviceManager deviceManager,
                                              java.util.function.Consumer<String> onSensorChanged) {
        JPanel sliderPanel = new JPanel(new BorderLayout(5, 0));
        sliderPanel.setBackground(UiTheme.PANEL_COLOR);

        JLabel minLabel = new JLabel("0\u00B0");
        minLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 10));
        minLabel.setForeground(UiTheme.LABEL_COLOR);
        sliderPanel.add(minLabel, BorderLayout.WEST);

        JSlider slider = new JSlider(0, 1023, state.intValue());
        slider.setBackground(UiTheme.PANEL_COLOR);
        slider.setForeground(UiTheme.TEXT_COLOR);
        slider.setMajorTickSpacing(256);
        slider.setMinorTickSpacing(64);
        slider.setPaintTicks(true);
        slider.setPaintLabels(true);
        slider.setFocusable(false);

        final String sensorId = state.deviceId();
        slider.addChangeListener(e -> {
            if (!slider.getValueIsAdjusting()) {
                try {
                    deviceManager.set(sensorId, slider.getValue());
                    if (onSensorChanged != null) onSensorChanged.accept(sensorId);
                } catch (IllegalArgumentException ex) {
                }
            }
        });

        sliderPanel.add(slider, BorderLayout.CENTER);

        JLabel maxLabel = new JLabel("1023\u00B0");
        maxLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 10));
        maxLabel.setForeground(UiTheme.LABEL_COLOR);
        sliderPanel.add(maxLabel, BorderLayout.EAST);

        return sliderPanel;
    }
}
