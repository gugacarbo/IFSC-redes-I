#include "DeviceManager.h"

void DeviceManager::init(const std::vector<String>& device_ids) {
    devices.clear();
    for (const String& id : device_ids) {
        DeviceState state;
        state.is_light = id.indexOf("_light_") != -1;
        state.bool_val = false;
        state.int_val = 0;
        devices[id] = state;
    }
}

bool DeviceManager::get(const String& id, DeviceState& out_state) {
    if (devices.find(id) != devices.end()) {
        out_state = devices[id];
        return true;
    }
    return false;
}

bool DeviceManager::set(const String& id, bool val) {
    if (devices.find(id) != devices.end() && devices[id].is_light) {
        devices[id].bool_val = val;
        return true;
    }
    return false;
}

bool DeviceManager::set(const String& id, int val) {
    if (devices.find(id) != devices.end() && !devices[id].is_light) {
        if (val < 0) val = 0;
        if (val > 1023) val = 1023;
        devices[id].int_val = val;
        return true;
    }
    return false;
}

std::vector<String> DeviceManager::list() {
    std::vector<String> keys;
    for (auto const& pair : devices) {
        keys.push_back(pair.first);
    }
    return keys;
}

bool DeviceManager::addDevice(const String& id) {
    if (devices.find(id) != devices.end()) return false;
    DeviceState state;
    state.is_light = id.indexOf("_light_") != -1;
    state.bool_val = false;
    state.int_val = 0;
    devices[id] = state;
    return true;
}

bool DeviceManager::removeDevice(const String& id) {
    return devices.erase(id) > 0;
}

String DeviceManager::getAllJson() {
    String json = "[";
    bool first = true;
    for (auto const& pair : devices) {
        if (!first) json += ",";
        first = false;
        json += "{";
        json += "\"id\":\"" + pair.first + "\",";
        json += "\"isLight\":" + String(pair.second.is_light ? "true" : "false") + ",";
        bool isSensor = pair.first.indexOf("sensor_") == 0;
        json += "\"isSensor\":" + String(isSensor ? "true" : "false") + ",";
        json += "\"boolValue\":" + String(pair.second.bool_val ? "true" : "false") + ",";
        json += "\"intValue\":" + String(pair.second.int_val);
        json += "}";
    }
    json += "]";
    return json;
}
