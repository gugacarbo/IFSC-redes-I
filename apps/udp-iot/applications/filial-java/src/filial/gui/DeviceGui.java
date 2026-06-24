package filial.gui;

import filial.gui.panel.HeaderPanelBuilder;
import filial.gui.panel.DevicePanelRenderer;
import filial.gui.theme.UiTheme;
import filial.model.DeviceManager;

import java.awt.BorderLayout;
import java.awt.Font;
import java.awt.GridLayout;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.Timer;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;

public class DeviceGui extends JFrame {

    private final DeviceManager deviceManager;
    private final java.util.function.Consumer<String> onSensorChanged;
    private final String host;
    private final int port;
    private Timer refreshTimer;
    private JPanel actuatorsPanel;
    private JPanel sensorsPanel;
    private DevicePanelRenderer renderer;

    public DeviceGui(DeviceManager deviceManager, String host, int port) {
        this.deviceManager = deviceManager;
        this.host = host;
        this.port = port;
        this.onSensorChanged = null;
        this.renderer = new DevicePanelRenderer(deviceManager, null);
        initUI();
        startRefreshTimer();
    }

    public DeviceGui(DeviceManager deviceManager, java.util.function.Consumer<String> onSensorChanged, String host, int port) {
        this.deviceManager = deviceManager;
        this.host = host;
        this.port = port;
        this.onSensorChanged = onSensorChanged;
        this.renderer = new DevicePanelRenderer(deviceManager, onSensorChanged);
        initUI();
        startRefreshTimer();
    }

    private void initUI() {
        setTitle("Filial IoT Simulator");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(800, 600);
        setLocationRelativeTo(null);
        setBackground(UiTheme.BG_COLOR);

        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));
        mainPanel.setBorder(new EmptyBorder(15, 15, 15, 15));
        mainPanel.setBackground(UiTheme.BG_COLOR);

        mainPanel.add(HeaderPanelBuilder.createHeaderPanel(host, port), BorderLayout.NORTH);

        JScrollPane scrollPane = new JScrollPane();
        scrollPane.setBackground(UiTheme.BG_COLOR);
        scrollPane.getViewport().setBackground(UiTheme.BG_COLOR);
        scrollPane.setBorder(null);

        JPanel contentPanel = new JPanel();
        contentPanel.setLayout(new BoxLayout(contentPanel, BoxLayout.Y_AXIS));
        contentPanel.setBackground(UiTheme.BG_COLOR);

        actuatorsPanel = createDevicesContainer();
        sensorsPanel = createDevicesContainer();
        renderer.rebuildDevicePanels(actuatorsPanel, sensorsPanel);

        JPanel sideBySidePanel = new JPanel(new GridLayout(1, 2, 10, 0));
        sideBySidePanel.setBackground(UiTheme.BG_COLOR);
        sideBySidePanel.add(createSectionPanel("Atuadores (Apenas Leitura)", actuatorsPanel));
        sideBySidePanel.add(createSectionPanel("Sensores (Editavel)", sensorsPanel));
        contentPanel.add(sideBySidePanel);

        scrollPane.setViewportView(contentPanel);
        mainPanel.add(scrollPane, BorderLayout.CENTER);
        mainPanel.add(createFooterPanel(), BorderLayout.SOUTH);

        add(mainPanel);

        addWindowListener(new java.awt.event.WindowAdapter() {
            @Override
            public void windowClosing(java.awt.event.WindowEvent e) {
                stopRefreshTimer();
            }
        });
    }

    private JPanel createSectionPanel(String title, JComponent content) {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(UiTheme.PANEL_COLOR);
        TitledBorder titledBorder = BorderFactory.createTitledBorder(
            BorderFactory.createLineBorder(UiTheme.ACCENT_COLOR, 1),
            title,
            TitledBorder.LEFT,
            TitledBorder.TOP,
            new Font(Font.SANS_SERIF, Font.BOLD, 13),
            UiTheme.TEXT_COLOR
        );
        panel.setBorder(BorderFactory.createCompoundBorder(
            new EmptyBorder(5, 5, 5, 5),
            titledBorder
        ));
        panel.add(content, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createDevicesContainer() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(UiTheme.PANEL_COLOR);
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));
        return panel;
    }

    private JPanel createFooterPanel() {
        JPanel panel = new JPanel();
        panel.setBackground(UiTheme.BG_COLOR);
        panel.setBorder(new EmptyBorder(10, 0, 0, 0));
        return panel;
    }

    private void startRefreshTimer() {
        refreshTimer = new Timer(500, e -> {
            if (renderer.haveDevicesChanged()) {
                renderer.rebuildDevicePanels(actuatorsPanel, sensorsPanel);
            }
            renderer.refreshAll();
        });
        refreshTimer.start();
    }

    private void stopRefreshTimer() {
        if (refreshTimer != null) {
            refreshTimer.stop();
            refreshTimer = null;
        }
    }
}
