package filial;

/**
 * Runtime state of a single IoT device.
 *
 * <p>A device is either a <b>light</b> (boolean on/off) or an
 * <b>AC unit</b> (analog intensity 0-1023). The type is inferred
 * from the device ID: if it contains {@code "_light_"} it is a light;
 * otherwise it is treated as an AC.
 *
 * <p>{@code sensor_} devices are read-only: the Matriz can query
 * their state but not change it.
 */
public class DeviceState {

    private final String  deviceId;
    private final boolean isLight;
    private final boolean isSensor;

    private boolean boolValue;   // used when isLight == true
    private int     intValue;    // used when isLight == false, range 0-1023

    public DeviceState(String deviceId) {
        this.deviceId = deviceId;
        this.isLight  = deviceId.contains("_light_");
        this.isSensor = deviceId.startsWith("sensor_");
        this.boolValue = false;      // default: light OFF
        this.intValue  = 0;          // default: AC at minimum
    }

    // ---- Getters ----

    public String  deviceId()  { return deviceId; }
    public boolean isLight()   { return isLight; }
    public boolean isSensor()  { return isSensor; }
    public boolean boolValue() { return boolValue; }
    public int     intValue()  { return intValue; }

    // ---- Setters with validation ----

    /** Set boolean value (only valid for light-type devices). */
    public void setValue(boolean value) {
        if (!isLight) {
            throw new IllegalArgumentException(
                "Device '" + deviceId + "' is not a light (boolean) device");
        }
        this.boolValue = value;
    }

    /** Set integer value (only valid for AC-type devices). Clamped to [0, 1023]. */
    public void setValue(int value) {
        if (isLight) {
            throw new IllegalArgumentException(
                "Device '" + deviceId + "' is a light device, use boolean setter");
        }
        this.intValue = Math.max(0, Math.min(1023, value));
    }

    @Override
    public String toString() {
        return deviceId + "=" + (isLight ? boolValue : intValue)
            + (isSensor ? " (read-only)" : "");
    }
}
