#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "DeviceManager.h"

// Hardcode for testing environment
const char* WIFI_SSID = "WOKWI-GUEST"; // Typical test/simulator SSID
const char* WIFI_PASS = "";

FilialConfig globalConfig;
DeviceManager deviceManager;

void connectWiFi() {
  Serial.printf("Connecting to %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" CONNECTED");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  
  if (ConfigManager::begin()) {
      if (ConfigManager::loadConfig(globalConfig)) {
          deviceManager.init(globalConfig.devices);
          Serial.println("Devices initialized.");
      }
  }
  
  connectWiFi();
}

void loop() {}
