#include "ConfigManager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

bool ConfigManager::begin() {
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS Mount Failed");
        return false;
    }
    return true;
}

bool ConfigManager::loadConfig(FilialConfig& config) {
    File file = LittleFS.open("/config_filial.json", "r");
    if (!file) {
        Serial.println("Failed to open config file");
        return false;
    }

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, file);
    if (error) {
        Serial.println("Failed to parse config file");
        return false;
    }

    config.port = doc["port"] | 51000;
    config.admin_user = doc["admin_user"] | "test";
    config.admin_pass = doc["admin_pass"] | "test";
    
    config.devices.clear();
    JsonArray ids = doc["id"];
    for (JsonVariant v : ids) {
        config.devices.push_back(v.as<String>());
    }

    file.close();
    return true;
}
