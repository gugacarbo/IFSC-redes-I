#include <Arduino.h>
#include "ConfigManager.h"

FilialConfig globalConfig;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting Filial ESP32...");
  
  if (ConfigManager::begin()) {
      if (ConfigManager::loadConfig(globalConfig)) {
          Serial.printf("Loaded! Port: %d, User: %s, Devices: %d\n", 
            globalConfig.port, globalConfig.admin_user.c_str(), globalConfig.devices.size());
      }
  }
}

void loop() {}
