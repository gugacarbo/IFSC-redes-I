#include <Arduino.h>
#include "ConfigManager.h"
#include "DeviceManager.h"

FilialConfig globalConfig;
DeviceManager deviceManager;

void setup() {
  Serial.begin(115200);
  
  if (ConfigManager::begin()) {
      if (ConfigManager::loadConfig(globalConfig)) {
          deviceManager.init(globalConfig.devices);
          Serial.println("Devices initialized.");
      }
  }
}

void loop() {}