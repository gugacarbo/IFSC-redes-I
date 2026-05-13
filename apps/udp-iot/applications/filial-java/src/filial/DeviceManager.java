package filial;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages the set of IoT devices in a Filial.
 *
 * <p>Thread-safe: backed by {@link ConcurrentHashMap}.
 * Provides lookup, state mutation, and listing operations
 * that mirror the ESP32 C++ {@code DeviceManager}.
 */
public class DeviceManager {

    private final ConcurrentHashMap<String, DeviceState> devices = new ConcurrentHashMap<>();

    /**
     * Initialise (or reset) the device map from a list of device IDs.
     * Each ID gets a default state (light=false, AC=0).
     */
    public void init(List<String> deviceIds) {
        devices.clear();
        for (String id : deviceIds) {
            devices.put(id, new DeviceState(id));
        }
    }

    /**
     * Retrieve the state for a given device ID.
     * @return the device state, or {@code null} if not found
     */
    public DeviceState get(String deviceId) {
        return devices.get(deviceId);
    }

    /**
     * Set a boolean value for a light device.
     * @throws IllegalArgumentException if device not found or is not a light
     */
    public void set(String deviceId, boolean value) {
        DeviceState ds = devices.get(deviceId);
        if (ds == null) throw new IllegalArgumentException("Device not found: " + deviceId);
        ds.setValue(value);
    }

    /**
     * Set an integer value for an AC device.
     * @throws IllegalArgumentException if device not found or is not an AC
     */
    public void set(String deviceId, int value) {
        DeviceState ds = devices.get(deviceId);
        if (ds == null) throw new IllegalArgumentException("Device not found: " + deviceId);
        ds.setValue(value);
    }

    /**
     * Return a snapshot of all device IDs (sorted by insertion order).
     */
    public List<String> list() {
        return List.copyOf(devices.keySet());
    }

    /**
     * Return a snapshot of all device states as a map (insertion order).
     */
    public Map<String, DeviceState> getAll() {
        return new LinkedHashMap<>(devices);
    }

    /** Number of managed devices. */
    public int count() {
        return devices.size();
    }

    /** Add a new device with default state. No-op if already exists. */
    public void addDevice(String deviceId) {
        devices.putIfAbsent(deviceId, new DeviceState(deviceId));
    }

    /** Remove a device. Returns true if it existed. */
    public boolean removeDevice(String deviceId) {
        return devices.remove(deviceId) != null;
    }

    /** Rename device from oldId to newId. Returns true if oldId existed. */
    public boolean updateDevice(String oldId, String newId) {
        DeviceState state = devices.remove(oldId);
        if (state == null) return false;
        DeviceState newState = new DeviceState(newId);
        if (state.isLight()) {
            newState.setValue(state.boolValue());
        } else {
            newState.setValue(state.intValue());
        }
        devices.put(newId, newState);
        return true;
    }
}
