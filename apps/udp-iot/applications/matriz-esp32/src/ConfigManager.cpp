#include "ConfigManager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

static const char* CONFIG_PATH = "/config_matriz.json";
static MatrizConfig config;

bool ConfigManager::begin() {
	if (!LittleFS.begin(true)) {
		Serial.println("LittleFS Mount Failed");
		return false;
	}

	File file = LittleFS.open(CONFIG_PATH, "r");
	if (!file) {
		return true;
	}

	String content = file.readString();
	file.close();

	JsonDocument doc;
	DeserializationError error = deserializeJson(doc, content);
	if (error) {
		return true;
	}

	config.user = doc["user"] | "";
	config.pass = doc["pass"] | "";
	config.polling_ms = doc["polling_ms"] | 0;

	JsonArray filiais = doc["filiais"].as<JsonArray>();
	for (JsonObject f : filiais) {
		FilialInfo info;
		info.name = f["name"] | "";
		info.ip = f["ip"] | "";
		info.port = f["port"] | 51000;
		config.filiais.push_back(info);
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

	config.user = doc["user"] | config.user;
	config.pass = doc["pass"] | config.pass;
	config.polling_ms = doc["polling_ms"] | config.polling_ms;

	JsonArray filiais = doc["filiais"].as<JsonArray>();
	if (!filiais.isNull()) {
		config.filiais.clear();
		for (JsonObject f : filiais) {
			FilialInfo info;
			info.name = f["name"] | "";
			info.ip = f["ip"] | "";
			info.port = f["port"] | 51000;
			config.filiais.push_back(info);
		}
	}

	return true;
}

MatrizConfig& ConfigManager::getConfig() {
	return config;
}
