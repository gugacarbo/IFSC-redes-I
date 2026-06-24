package filial.gui.panel;

import filial.gui.theme.UiTheme;
import filial.model.DeviceManager;
import filial.model.DeviceState;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.swing.Box;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSeparator;
import javax.swing.JSlider;
import javax.swing.JToggleButton;

public class DevicePanelRenderer {

    private final DeviceManager deviceManager;
    private final java.util.function.Consumer<String> onSensorChanged;
    private final Map<String, JLabel> actuatorLabels = new HashMap<>();
    private final Map<String, JToggleButton> lightSensorSwitches = new HashMap<>();
    private final Map<String, JSlider> acSensorSliders = new HashMap<>();
    private String renderedDevicesFingerprint = "";

    public DevicePanelRenderer(DeviceManager deviceManager, java.util.function.Consumer<String> onSensorChanged) {
        this.deviceManager = deviceManager;
        this.onSensorChanged = onSensorChanged;
    }

    public void rebuildDevicePanels(JPanel actuatorsPanel, JPanel sensorsPanel) {
        if (actuatorsPanel == null || sensorsPanel == null) {
            return;
        }

        actuatorLabels.clear();
        lightSensorSwitches.clear();
        acSensorSliders.clear();

        actuatorsPanel.removeAll();
        sensorsPanel.removeAll();

        int actuatorCount = 0;
        int sensorCount = 0;

        for (String deviceId : getSortedDeviceIds()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state == null) {
                continue;
            }

            if (state.isSensor()) {
                JPanel sensorPanel = SensorPanelBuilder.createSensorPanel(state, deviceManager, onSensorChanged);
                sensorsPanel.add(sensorPanel);
                sensorsPanel.add(Box.createVerticalStrut(2));
                JSeparator sensorSep = new JSeparator(JSeparator.HORIZONTAL);
                sensorSep.setForeground(UiTheme.SEPARATOR_COLOR);
                sensorSep.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 1));
                sensorsPanel.add(sensorSep);
                sensorsPanel.add(Box.createVerticalStrut(2));
                sensorCount++;
            } else {
                JPanel devicePanel = ActuatorPanelBuilder.createActuatorPanel(state);
                actuatorLabels.put(deviceId, (JLabel) devicePanel.getComponent(2));
                actuatorsPanel.add(devicePanel);
                actuatorsPanel.add(Box.createVerticalStrut(2));
                JSeparator actuatorSep = new JSeparator(JSeparator.HORIZONTAL);
                actuatorSep.setForeground(UiTheme.SEPARATOR_COLOR);
                actuatorSep.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 1));
                actuatorsPanel.add(actuatorSep);
                actuatorsPanel.add(Box.createVerticalStrut(2));
                actuatorCount++;
            }
        }

        if (actuatorCount == 0) {
            actuatorsPanel.add(createEmptyStateLabel("Nenhum atuador configurado"));
        }

        if (sensorCount == 0) {
            sensorsPanel.add(createEmptyStateLabel("Nenhum sensor configurado"));
        }

        renderedDevicesFingerprint = buildDeviceFingerprint();
        actuatorsPanel.revalidate();
        actuatorsPanel.repaint();
        sensorsPanel.revalidate();
        sensorsPanel.repaint();
    }

    public void refreshAll() {
        refreshActuators();

        for (String deviceId : lightSensorSwitches.keySet()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null) {
                JToggleButton toggle = lightSensorSwitches.get(deviceId);
                if (toggle.isSelected() != state.boolValue()) {
                    toggle.setSelected(state.boolValue());
                }
            }
        }

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

    public boolean haveDevicesChanged() {
        return !buildDeviceFingerprint().equals(renderedDevicesFingerprint);
    }

    public List<String> getSortedDeviceIds() {
        List<String> ids = new ArrayList<>(deviceManager.list());
        ids.sort(String::compareToIgnoreCase);
        return ids;
    }

    public String buildDeviceFingerprint() {
        return String.join("|", getSortedDeviceIds());
    }

    private JLabel createEmptyStateLabel(String text) {
        JLabel empty = new JLabel(text);
        empty.setForeground(UiTheme.LABEL_COLOR);
        empty.setAlignmentX(java.awt.Component.CENTER_ALIGNMENT);
        return empty;
    }

    private void refreshActuators() {
        for (String deviceId : actuatorLabels.keySet()) {
            DeviceState state = deviceManager.get(deviceId);
            if (state != null) {
                JLabel label = actuatorLabels.get(deviceId);
                if (label != null) {
                    ActuatorPanelBuilder.updateActuatorValueLabel(label, state);
                }
            }
        }
    }
}
