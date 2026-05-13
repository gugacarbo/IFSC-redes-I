#ifndef DEVICE_MANAGER_H
#define DEVICE_MANAGER_H

#include <Arduino.h>
#include <map>
#include <vector>

struct DeviceState {
    bool is_light; // true if light, false if AC
    bool bool_val; // for light
    int int_val;   // for AC (0-1023)
};

class DeviceManager {
private:
    std::map<String, DeviceState> devices;
public:
    void init(const std::vector<String>& device_ids);
    bool get(const String& id, DeviceState& out_state);
    bool set(const String& id, bool val);
    bool set(const String& id, int val);
    std::vector<String> list();
    bool addDevice(const String& id);
    bool removeDevice(const String& id);
    String getAllJson();
};

#endif
