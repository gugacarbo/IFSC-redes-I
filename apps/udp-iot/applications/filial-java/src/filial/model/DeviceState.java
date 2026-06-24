package filial.model;

public class DeviceState {

    private final String  deviceId;
    private final boolean isLight;
    private final boolean isSensor;

    private boolean boolValue;
    private int     intValue;

    public DeviceState(String deviceId) {
        this.deviceId = deviceId;
        this.isLight  = deviceId.contains("_light_");
        this.isSensor = deviceId.startsWith("sensor_");
        this.boolValue = false;
        this.intValue  = 0;
    }

    public String  deviceId()  { return deviceId; }
    public boolean isLight()   { return isLight; }
    public boolean isSensor()  { return isSensor; }
    public boolean boolValue() { return boolValue; }
    public int     intValue()  { return intValue; }

    public void setValue(boolean value) {
        if (!isLight) {
            throw new IllegalArgumentException(
                "Device '" + deviceId + "' is not a light (boolean) device");
        }
        this.boolValue = value;
    }

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
