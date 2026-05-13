#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "ApiServer.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

ApiServer apiServer;

void connectWiFi() {
	WiFi.begin(WIFI_SSID, WIFI_PASS);
	while (WiFi.status() != WL_CONNECTED) { delay(500); }
	Serial.print("Matriz IP: ");
	Serial.println(WiFi.localIP());
}

void setup() {
	Serial.begin(115200);
	if (ConfigManager::begin()) {
		connectWiFi();
		apiServer.begin();
	}
}

void loop() {}
