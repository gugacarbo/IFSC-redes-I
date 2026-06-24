package matriz.state;

import shared.Json.JsonObject;
import shared.Json.JsonValue;
import matriz.model.FilialInfo;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

class FilialStatusExporter {

	private final ConcurrentHashMap<String, JsonObject> deviceStates;
	private final ConcurrentHashMap<String, Long> lastSeen;

	static final long ONLINE_TIMEOUT_MS = 15_000;

	FilialStatusExporter(ConcurrentHashMap<String, JsonObject> deviceStates,
						 ConcurrentHashMap<String, Long> lastSeen) {
		this.deviceStates = deviceStates;
		this.lastSeen = lastSeen;
	}

	JsonObject getAllStates(List<FilialInfo> filiais) {
		JsonObject result = new JsonObject();
		for (FilialInfo filial : filiais) {
			result.put(filial.ip(), buildFilialStatus(filial));
		}
		return result;
	}

	private JsonObject buildFilialStatus(FilialInfo filial) {
		long now = System.currentTimeMillis();
		long seen = lastSeen.getOrDefault(filial.ip(), 0L);
		boolean online = seen > 0 && (now - seen) < ONLINE_TIMEOUT_MS;

		JsonObject entry = new JsonObject();
		entry.put("name", filial.name());
		entry.put("ip", filial.ip());
		entry.put("port", filial.port());
		entry.put("online", online);
		entry.put("lastSeen", seen);
		entry.put("devices", extractDevices(filial.ip()));
		return entry;
	}

	private JsonObject extractDevices(String ip) {
		JsonObject raw = deviceStates.get(ip);
		if (raw == null) return new JsonObject();

		JsonObject devices = new JsonObject();
		for (Map.Entry<String, JsonValue> entry : raw.entries()) {
			String key = entry.getKey();
			if ("cmd".equals(key) || "user".equals(key)
				|| "pass".equals(key) || "error".equals(key)) {
				continue;
			}
			devices.put(key, entry.getValue());
		}
		return devices;
	}
}
