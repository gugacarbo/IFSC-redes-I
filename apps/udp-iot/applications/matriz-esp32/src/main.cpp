#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "ApiServer.h"
#include "BridgeManager.h"
#include "LogCapture.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

ApiServer apiServer;
BridgeManager bridge;

// Global pointer so ApiServer can reset poll timer on config change
BridgeManager* g_bridgeManager = nullptr;

void connectWiFi() {
	WiFi.begin(WIFI_SSID, WIFI_PASS);
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
	}
	LogCapture::printf("Matriz IP: %s", WiFi.localIP().toString().c_str());
}

void setup() {
	Serial.begin(115200);
	LogCapture::begin(500);
	LogCapture::println("Matriz IoT (ESP32) starting...");
	if (ConfigManager::begin()) {
		connectWiFi();
		bridge.begin(apiServer.getServer());
		LogCapture::setBroadcastCallback([](const char* json) {
			bridge.broadcast(json);
		});
		g_bridgeManager = &bridge;
		apiServer.setBridgeManager(g_bridgeManager);
		apiServer.begin();
	}
}

void loop() {
	bridge.loop();
}
