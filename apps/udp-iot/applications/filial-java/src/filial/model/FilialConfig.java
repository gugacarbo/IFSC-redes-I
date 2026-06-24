package filial.model;

import java.util.List;

public record FilialConfig(
    int port,
    int httpPort,
    String adminUser,
    String adminPass,
    List<String> deviceIds
) {
    public FilialConfig {
        deviceIds = List.copyOf(deviceIds);
    }
}
