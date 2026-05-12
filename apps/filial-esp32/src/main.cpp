#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "DeviceManager.h"
#include "UdpServer.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

FilialConfig globalConfig;
DeviceManager deviceManager;
UdpServerWrapper udpServer;

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
      }
  }
  
  connectWiFi();
  
  // Start UDP after WiFi
  udpServer.begin(&globalConfig, &deviceManager);
}

void loop() {
    // AsyncUDP handles everything in background via interrupts/callbacks
    delay(1000);
}
