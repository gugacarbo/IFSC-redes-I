package matriz.state;

import shared.Json.JsonObject;
import matriz.model.FilialInfo;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

public class FilialStateTracker {

	private final ConcurrentHashMap<String, JsonObject> deviceStates = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Long> lastSeen = new ConcurrentHashMap<>();
	private final FilialStatusExporter exporter = new FilialStatusExporter(deviceStates, lastSeen);

	public void updateDeviceState(String ip, JsonObject state) {
		deviceStates.put(ip, state);
		lastSeen.put(ip, System.currentTimeMillis());
	}

	public void markContacted(String ip) {
		lastSeen.put(ip, System.currentTimeMillis());
	}

	public JsonObject getDeviceState(String ip) {
		return deviceStates.get(ip);
	}

	public long getLastSeen(String ip) {
		return lastSeen.getOrDefault(ip, 0L);
	}

	public boolean isOnline(String ip) {
		Long seen = lastSeen.get(ip);
		if (seen == null) return false;
		return (System.currentTimeMillis() - seen) < FilialStatusExporter.ONLINE_TIMEOUT_MS;
	}

	public JsonObject getAllStates(List<FilialInfo> filiais) {
		return exporter.getAllStates(filiais);
	}
}
