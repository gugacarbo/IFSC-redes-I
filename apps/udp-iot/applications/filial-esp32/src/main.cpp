#include <Arduino.h>
#include <WiFi.h>
#include "ConfigManager.h"
#include "DeviceManager.h"
#include "UdpServer.h"
#include "DeviceBridge.h"
#include "ApiServer.h"
#include "LogCapture.h"

const char* WIFI_SSID = "WOKWI-GUEST";
const char* WIFI_PASS = "";

FilialConfig globalConfig;
DeviceManager deviceManager;
UdpServerWrapper udpServer;
DeviceBridge deviceBridge;
ApiServer* apiServer = nullptr;

void connectWiFi() {
  Serial.printf("Connecting to %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  LogCapture::println("WiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  LogCapture::begin(500);
  LogCapture::println("Filial IoT (ESP32) starting...");
  
  if (ConfigManager::begin()) {
      if (ConfigManager::loadConfig(globalConfig)) {
          deviceManager.init(globalConfig.devices);
      }
  }
  
  connectWiFi();
  
  // UDP server (Matriz communication)
  udpServer.begin(&globalConfig, &deviceManager);

  // HTTP + WebSocket server (GUI communication)
  uint16_t httpPort = globalConfig.http_port > 0 ? globalConfig.http_port : 80;
  apiServer = new ApiServer(httpPort);
  deviceBridge.begin(apiServer->getServer(), &deviceManager);
  LogCapture::setBroadcastCallback([](const char* json) {
      deviceBridge.broadcast(json);
  });
  apiServer->begin(&deviceManager);

  LogCapture::printf("Filial ready. UDP port: %d, HTTP/WS port: %d", globalConfig.port, httpPort);
}

void loop() {
    // AsyncUDP + AsyncWebServer handle everything via callbacks
    delay(1000);
}
