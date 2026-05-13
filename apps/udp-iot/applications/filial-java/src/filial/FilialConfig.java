package filial;

import java.util.List;

/**
 * Configuration data for a Filial (branch) instance.
 *
 * @param port       UDP port to listen on (default 51000)
 * @param httpPort   HTTP + WebSocket port (default 8082)
 * @param adminUser  Username for command authentication
 * @param adminPass  Password for command authentication
 * @param deviceIds  List of device IDs managed by this filial
 */
public record FilialConfig(
    int port,
    int httpPort,
    String adminUser,
    String adminPass,
    List<String> deviceIds
) {}
