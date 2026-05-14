package filial;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;
import java.awt.*;
import java.awt.event.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Desktop GUI for simulating IoT sensors and viewing actuator states.
 *
 * <p>Features:
 * <ul>
 *   <li>View real-time state of all actuators (lights and AC units)</li>
 *   <li>Edit sensor values to simulate real-world conditions</li>
 *   <li>Auto-update when device states change externally</li>
 * </ul>
 */
public class DeviceGui extends JFrame {

    private final DeviceManager deviceManager;
    private final Map<String, JSlider> acSensorSliders = new HashMap<>();
    private final Map<String, JToggleButton> lightSensorSwitches = new HashMap<>();
    private final Map<String, JLabel> actuatorLabels = new HashMap<>();
    private Timer refreshTimer;

    // UI Colors
    private static final Color BG_COLOR = new Color(30, 35, 45);
    private static final Color PANEL_COLOR = new Color(45, 52, 65);
    private static final Color ACCENT_COLOR = new Color(0, 180, 216);
    private static final Color SUCCESS_COLOR = new Color(46, 213, 115);
    private static final Color WARNING_COLOR = new Color(255, 165, 2);
    private static final Color TEXT_COLOR = new Color(223, 228, 234);
    private static final Color LABEL_COLOR = new Color(178, 190, 195);

    public DeviceGui(DeviceManager deviceManager) {
        this.deviceManager = deviceManager;
        initUI();
        startRefreshTimer();
    }

    private void initUI() {
        setTitle("Filial IoT Simulator");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(550, 480);
        setLocationRelativeTo(null);
        setBackground(BG_COLOR);

        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));
        mainPanel.setBorder(new EmptyBorder(15, 15, 15, 15));
        mainPanel.setBackground(BG_COLOR);

        // Header
        mainPanel.add(createHeaderPanel(), BorderLayout.NORTH);

        // Content
        JScrollPane scrollPane = new JScrollPane();
        scrollPane.setBackground(BG_COLOR);
        scrollPane.getViewport().setBackground(BG_COLOR);
        scrollPane.setBorder(null);

        JPanel contentPanel = new JPanel();
        contentPanel.setLayout(new BoxLayout(contentPanel, BoxLayout.Y_AXIS));
        contentPanel.setBackground(BG_COLOR);

        contentPanel.add(createSectionPanel("Atuadores (Apenas Leitura)", createActuatorsPanel()));
        contentPanel.add(Box.createVerticalStrut(15));
        contentPanel.add(createSectionPanel("Sensores (Editavel)", createSensorsPanel()));

        scrollPane.setViewportView(contentPanel);
        mainPanel.add(scrollPane, BorderLayout.CENTER);
        mainPanel.add(createFooterPanel(), BorderLayout.SOUTH);

        add(mainPanel);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                stopRefreshTimer();
            }
        });
    }

    private JPanel createHeaderPanel() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panel.setBackground(BG_COLOR);
        panel.setBorder(new EmptyBorder(0, 0, 10, 0));

        JLabel icon = new JLabel("🏢  ");
        icon.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 28));
        panel.add(icon);

        JLabel title = new JLabel("Filial IoT Simulator");
        title.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 22));
        title.setForeground(ACCENT_COLOR);
        panel.add(title);

        return panel;
    }

    private JPanel createSectionPanel(String title, JComponent content) {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(PANEL_COLOR);
        TitledBorder titledBorder = BorderFactory.createTitledBorder(
            BorderFactory.createLineBorder(ACCENT_COLOR, 1),
            title,
            TitledBorder.LEFT,
            TitledBorder.TOP,
            new Font(Font.SANS_SERIF, Font.BOLD, 13),
            TEXT_COLOR
        );
        panel.setBorder(BorderFactory.createCompoundBorder(
            new EmptyBorder(5, 5, 5, 5),
            titledBorder
        ));
        panel.add(content, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createActuatorsPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(PANEL_COLOR);
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));

        for (String deviceId : deviceManager.list()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null && !state.isSensor()) {
                JPanel devicePanel = createActuatorPanel(state);
                // Label is at index 2 (icon, name, label)
                actuatorLabels.put(deviceId, (JLabel) devicePanel.getComponent(2));
                panel.add(devicePanel);
                panel.add(Box.createVerticalStrut(8));
            }
        }

        if (actuatorLabels.isEmpty()) {
            JLabel empty = new JLabel("Nenhum atuador configurado");
            empty.setForeground(LABEL_COLOR);
            empty.setAlignmentX(Component.CENTER_ALIGNMENT);
            panel.add(empty);
        }

        return panel;
    }

    private JPanel createActuatorPanel(DeviceState state) {
        JPanel panel = new JPanel(new BorderLayout(10, 0));
        panel.setBackground(PANEL_COLOR);
        panel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 50));
        panel.setAlignmentX(Component.LEFT_ALIGNMENT);

        String icon = state.isLight() ? "💡" : "❄️";
        JLabel iconLabel = new JLabel(icon + "  ");
        iconLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 20));
        panel.add(iconLabel, BorderLayout.WEST);

        JLabel nameLabel = new JLabel(formatDeviceName(state.deviceId()));
        nameLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 14));
        nameLabel.setForeground(TEXT_COLOR);
        panel.add(nameLabel, BorderLayout.CENTER);

        JLabel valueLabel = new JLabel();
        valueLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 16));
        valueLabel.setHorizontalAlignment(SwingConstants.RIGHT);
        updateActuatorValueLabel(valueLabel, state);
        panel.add(valueLabel, BorderLayout.EAST);

        return panel;
    }

    private void updateActuatorValueLabel(JLabel label, DeviceState state) {
        if (state.isLight()) {
            boolean isOn = state.boolValue();
            label.setText(isOn ? "LIGADO" : "DESLIGADO");
            label.setForeground(isOn ? SUCCESS_COLOR : LABEL_COLOR);
        } else {
            int value = state.intValue();
            int percent = (int) ((value / 1023.0) * 100);
            label.setText(value + " (" + percent + "%)");
            Color color;
            if (percent < 33) color = SUCCESS_COLOR;
            else if (percent < 66) color = WARNING_COLOR;
            else color = new Color(255, 71, 87);
            label.setForeground(color);
        }
    }

    private JPanel createSensorsPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(PANEL_COLOR);
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));

        for (String deviceId : deviceManager.list()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null && state.isSensor()) {
                JPanel sensorPanel = createSensorPanel(state);
                panel.add(sensorPanel);
                panel.add(Box.createVerticalStrut(8));
            }
        }

        if (acSensorSliders.isEmpty() && lightSensorSwitches.isEmpty()) {
            JLabel empty = new JLabel("Nenhum sensor configurado");
            empty.setForeground(LABEL_COLOR);
            empty.setAlignmentX(Component.CENTER_ALIGNMENT);
            panel.add(empty);
        }

        return panel;
    }

    private JPanel createSensorPanel(DeviceState state) {
        JPanel panel = new JPanel(new BorderLayout(10, 5));
        panel.setBackground(PANEL_COLOR);
        panel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 60));
        panel.setAlignmentX(Component.LEFT_ALIGNMENT);

        String icon = state.isLight() ? "🔆" : "🌡️";
        String deviceType = state.isLight() ? "Luminosidade" : "Temperatura";
        JLabel titleLabel = new JLabel(icon + "  " + formatDeviceName(state.deviceId()));
        titleLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 14));
        titleLabel.setForeground(TEXT_COLOR);
        panel.add(titleLabel, BorderLayout.WEST);

        JLabel typeLabel = new JLabel(deviceType);
        typeLabel.setFont(new Font(Font.SANS_SERIF, Font.ITALIC, 11));
        typeLabel.setForeground(LABEL_COLOR);
        panel.add(typeLabel, BorderLayout.EAST);

        // Control based on sensor type
        if (state.isLight()) {
            // Light sensor: Switch ON/OFF
            JToggleButton switchBtn = createSwitch(state);
            panel.add(switchBtn, BorderLayout.SOUTH);
            lightSensorSwitches.put(state.deviceId(), switchBtn);
        } else {
            // AC sensor: Slider
            JPanel sliderPanel = createAcSliderPanel(state);
            panel.add(sliderPanel, BorderLayout.SOUTH);
        }

        return panel;
    }

    private JToggleButton createSwitch(DeviceState state) {
        JToggleButton toggle = new JToggleButton();
        toggle.setBackground(PANEL_COLOR);
        toggle.setForeground(TEXT_COLOR);
        toggle.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
        toggle.setFocusPainted(false);
        toggle.setBorderPainted(false);
        toggle.setBorder(null);
        toggle.setMargin(new Insets(5, 15, 5, 15));

        // Initial state
        boolean isOn = state.intValue() > 512;
        toggle.setSelected(isOn);
        updateSwitchAppearance(toggle, isOn);

        final String sensorId = state.deviceId();
        toggle.addItemListener(e -> {
            boolean selected = toggle.isSelected();
            updateSwitchAppearance(toggle, selected);
            try {
                // Light sensor: 1023 = light detected, 0 = dark
                deviceManager.set(sensorId, selected ? 1023 : 0);
            } catch (IllegalArgumentException ex) {
                // Ignore
            }
        });

        return toggle;
    }

    private void updateSwitchAppearance(JToggleButton toggle, boolean selected) {
        if (selected) {
            toggle.setText("☀ LUMINOSO");
            toggle.setBackground(SUCCESS_COLOR);
            toggle.setForeground(Color.BLACK);
        } else {
            toggle.setText("🌙 ESCURO");
            toggle.setBackground(LABEL_COLOR);
            toggle.setForeground(Color.BLACK);
        }
    }

    private JPanel createAcSliderPanel(DeviceState state) {
        JPanel sliderPanel = new JPanel(new BorderLayout(5, 0));
        sliderPanel.setBackground(PANEL_COLOR);

        JLabel minLabel = new JLabel("0°");
        minLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 10));
        minLabel.setForeground(LABEL_COLOR);
        sliderPanel.add(minLabel, BorderLayout.WEST);

        JSlider slider = new JSlider(0, 1023, state.intValue());
        slider.setBackground(PANEL_COLOR);
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
                } catch (IllegalArgumentException ex) {
                    // Ignore
                }
            }
        });

        acSensorSliders.put(state.deviceId(), slider);
        sliderPanel.add(slider, BorderLayout.CENTER);

        JLabel maxLabel = new JLabel("1023°");
        maxLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 10));
        maxLabel.setForeground(LABEL_COLOR);
        sliderPanel.add(maxLabel, BorderLayout.EAST);

        return sliderPanel;
    }

    private JPanel createFooterPanel() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        panel.setBackground(BG_COLOR);
        panel.setBorder(new EmptyBorder(10, 0, 0, 0));

        JLabel status = new JLabel("● Conectado");
        status.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
        status.setForeground(SUCCESS_COLOR);
        panel.add(status);

        panel.add(Box.createHorizontalStrut(20));

        JButton refreshBtn = new JButton("Atualizar");
        refreshBtn.setFocusPainted(false);
        refreshBtn.setBackground(ACCENT_COLOR);
        refreshBtn.setForeground(Color.WHITE);
        refreshBtn.setBorderPainted(false);
        refreshBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        refreshBtn.addActionListener(e -> refreshAll());
        panel.add(refreshBtn);

        return panel;
    }

    private String formatDeviceName(String deviceId) {
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

    private void startRefreshTimer() {
        refreshTimer = new Timer(500, e -> refreshActuators());
        refreshTimer.start();
    }

    private void stopRefreshTimer() {
        if (refreshTimer != null) {
            refreshTimer.stop();
            refreshTimer = null;
        }
    }

    private void refreshActuators() {
        for (String deviceId : actuatorLabels.keySet()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null) {
                JLabel label = actuatorLabels.get(deviceId);
                if (label != null) {
                    updateActuatorValueLabel(label, state);
                }
            }
        }
    }

    private void refreshAll() {
        refreshActuators();

        // Refresh light sensors
        for (String deviceId : lightSensorSwitches.keySet()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null) {
                JToggleButton toggle = lightSensorSwitches.get(deviceId);
                boolean isOn = state.intValue() > 512;
                if (toggle.isSelected() != isOn) {
                    toggle.setSelected(isOn);
                    updateSwitchAppearance(toggle, isOn);
                }
            }
        }

        // Refresh AC sensors
        for (String deviceId : acSensorSliders.keySet()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null) {
                JSlider slider = acSensorSliders.get(deviceId);
                if (slider != null && slider.getValue() != state.intValue()) {
                    slider.setValue(state.intValue());
                }
            }
        }
    }
}
