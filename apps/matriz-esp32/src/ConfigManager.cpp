#include "ConfigManager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

static const char* CONFIG_PATH = "/config_matriz.json";

bool ConfigManager::begin() {
	if (!LittleFS.begin(true)) {
		Serial.println("LittleFS Mount Failed");
		return false;
	}
	return true;
}

String ConfigManager::getConfigJson() {
	File file = LittleFS.open(CONFIG_PATH, "r");
	if (!file) {
		return "{}";
	}

	String content = file.readString();
	file.close();
	return content;
}

bool ConfigManager::saveConfig(const String& body) {
	JsonDocument doc;
	DeserializationError error = deserializeJson(doc, body);
	if (error) {
		Serial.println("JSON parse error");
		return false;
	}

	if (!doc["user"].is<const char*>() || !doc["pass"].is<const char*>()) {
		return false;
	}

	File file = LittleFS.open(CONFIG_PATH, "w");
	if (!file) {
		Serial.println("Failed to open config for writing");
		return false;
	}

	if (serializeJson(doc, file) == 0) {
		file.close();
		return false;
	}

	file.close();
	return true;
}
