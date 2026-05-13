#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include "DeviceManager.h"

class ApiServer {
private:
    AsyncWebServer server;
    DeviceManager* devMgr;
    uint16_t httpPort;
    void setupRoutes();
public:
    ApiServer(uint16_t port) : server(port), httpPort(port) {}
    void begin(DeviceManager* mgr);
    AsyncWebServer& getServer() { return server; }
};

#endif
