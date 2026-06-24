package filial.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class DeviceManager {

    private final ConcurrentHashMap<String, DeviceState> devices = new ConcurrentHashMap<>();

    public void init(List<String> deviceIds) {
        devices.clear();
        for (String id : deviceIds) {
            devices.put(id, new DeviceState(id));
        }
    }

    public DeviceState get(String deviceId) {
        return devices.get(deviceId);
    }

    public void set(String deviceId, boolean value) {
        DeviceState ds = devices.get(deviceId);
        if (ds == null) throw new IllegalArgumentException("Device not found: " + deviceId);
        ds.setValue(value);
    }

    public void set(String deviceId, int value) {
        DeviceState ds = devices.get(deviceId);
        if (ds == null) throw new IllegalArgumentException("Device not found: " + deviceId);
        ds.setValue(value);
    }

    public List<String> list() {
        return List.copyOf(devices.keySet());
    }

    public Map<String, DeviceState> getAll() {
        return new LinkedHashMap<>(devices);
    }

    public int count() {
        return devices.size();
    }

    public void addDevice(String deviceId) {
        devices.putIfAbsent(deviceId, new DeviceState(deviceId));
    }

    public boolean removeDevice(String deviceId) {
        return devices.remove(deviceId) != null;
    }

    public synchronized boolean updateDevice(String oldId, String newId) {
        DeviceState state = devices.remove(oldId);
        if (state == null) return false;
        DeviceState newState = new DeviceState(newId);
        if (state.isLight()) {
            newState.setValue(state.boolValue());
        } else {
            newState.setValue(state.intValue());
        }
        DeviceState existing = devices.putIfAbsent(newId, newState);
        if (existing != null) {
            devices.put(oldId, state);
            return false;
        }
        return true;
    }
}
