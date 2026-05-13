#ifndef DEVICE_BRIDGE_H
#define DEVICE_BRIDGE_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include "DeviceManager.h"

class DeviceBridge {
private:
    AsyncWebSocket ws;
    DeviceManager* devMgr;
    void handleWsMessage(void* arg, uint8_t* data, size_t len);
public:
    DeviceBridge() : ws("/ws") {}
    void begin(AsyncWebServer& server, DeviceManager* mgr);
    void broadcastDevicesUpdated();
    void broadcast(const char* json);
};

#endif
