package filial.config;

import filial.model.FilialConfig;
import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.Protocol;

import java.util.ArrayList;
import java.util.List;

public class ConfigSerializer {

    public static FilialConfig parseConfig(String content) {
        JsonObject obj = Json.parseObject(content);

        int port = obj.getInt("port", Protocol.DEFAULT_PORT);
        String user = obj.getString("admin_user", Protocol.DEFAULT_USER);
        String pass = obj.getString("admin_pass", Protocol.DEFAULT_PASS);
        int httpPort = obj.getInt("http_port", Protocol.DEFAULT_HTTP_PORT);

        List<String> deviceIds = new ArrayList<>();
        if (obj.has("id")) {
            JsonArray arr = obj.getArray("id");
            for (int i = 0; i < arr.size(); i++) {
                deviceIds.add(arr.getString(i));
            }
        }

        return new FilialConfig(port, httpPort, user, pass, deviceIds);
    }

    public static String serialize(FilialConfig cfg) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("\t\"port\": ").append(cfg.port()).append(",\n");
        sb.append("\t\"http_port\": ").append(cfg.httpPort()).append(",\n");
        sb.append("\t\"admin_user\": ").append(Json.escape(cfg.adminUser())).append(",\n");
        sb.append("\t\"admin_pass\": ").append(Json.escape(cfg.adminPass())).append(",\n");
        sb.append("\t\"id\": [\n");

        List<String> deviceIds = cfg.deviceIds();
        for (int i = 0; i < deviceIds.size(); i++) {
            sb.append("\t\t").append(Json.escape(deviceIds.get(i)));
            if (i < deviceIds.size() - 1) {
                sb.append(",");
            }
            sb.append("\n");
        }

        sb.append("\t]\n");
        sb.append("}\n");
        return sb.toString();
    }

    public static boolean isValidPort(int port) {
        return port >= 1 && port <= 65535;
    }

    private ConfigSerializer() {}
}
