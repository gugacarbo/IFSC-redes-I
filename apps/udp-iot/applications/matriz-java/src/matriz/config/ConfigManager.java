package matriz.config;

import lib.logging.Logger;
import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import matriz.model.FilialInfo;
import matriz.model.MatrizConfig;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ConfigManager {

	private static final Logger logger = Logger.getLogger(ConfigManager.class);

	private volatile MatrizConfig config;
	private String configPath;
	private final ConfigFileIO fileIO = new ConfigFileIO();

	public synchronized boolean load(String path) {
		this.configPath = path;
		try {
			this.config = readConfigFromDisk();
			return true;
		} catch (IOException e) {
			logger.error("ConfigManager: IO error: {}", e.getMessage());
			return false;
		} catch (RuntimeException e) {
			logger.error("ConfigManager: Parse error: {}", e.getMessage());
			return false;
		}
	}

	public synchronized boolean save(String jsonContent) {
		try {
			JsonObject obj = Json.parseObject(jsonContent);
			if (!obj.has("user") || !obj.has("pass")) {
				logger.warn("ConfigManager: Refusing to save -- missing user/pass");
				return false;
			}

			MatrizConfig parsed = parseConfig(obj);
			fileIO.writeAtomic(jsonContent, configPath);
			this.config = readConfigFromDisk();
			logger.info("ConfigManager: Configuration saved ({} filiais)", parsed.filiais().size());
			return true;
		} catch (IOException e) {
			logger.error("ConfigManager: IO error on save: {}", e.getMessage());
			return false;
		} catch (RuntimeException e) {
			logger.error("ConfigManager: Invalid JSON on save: {}", e.getMessage());
			return false;
		}
	}

	public synchronized String getConfigJson() {
		try {
			return fileIO.readString(configPath);
		} catch (IOException e) {
			throw new RuntimeException("ConfigManager: Could not read config JSON", e);
		}
	}

	public synchronized MatrizConfig getConfig() {
		try {
			this.config = readConfigFromDisk();
			return config;
		} catch (IOException e) {
			throw new RuntimeException("ConfigManager: Could not refresh config from disk", e);
		}
	}

	public synchronized int findPortByIp(String ip) {
		for (FilialInfo f : getConfig().filiais()) {
			if (f.ip().equals(ip)) return f.port();
		}
		return 51000;
	}

	private MatrizConfig readConfigFromDisk() throws IOException {
		String content = fileIO.readString(configPath);
		JsonObject obj = Json.parseObject(content);
		return parseConfig(obj);
	}

	private MatrizConfig parseConfig(JsonObject obj) {
		String user = obj.getString("user", "admin");
		String pass = obj.getString("pass", "admin");
		int pollingMs = resolvePollingMs(obj);

		List<FilialInfo> filiais = new ArrayList<>();
		if (obj.has("filiais")) {
			JsonArray arr = obj.getArray("filiais");
			for (int i = 0; i < arr.size(); i++) {
				JsonObject f = arr.getObject(i);
				String name = f.getString("name", "Filial " + (i + 1));
				String ip   = f.getString("ip", "127.0.0.1");
				int port    = f.getInt("port", 51000);
				filiais.add(new FilialInfo(name, ip, port));
			}
		}

		return new MatrizConfig(user, pass, pollingMs, filiais);
	}

	private int resolvePollingMs(JsonObject obj) {
		if (obj.has("pollingMs")) {
			return obj.getInt("pollingMs", 0);
		}
		return obj.getInt("polling_ms", 0);
	}
}
