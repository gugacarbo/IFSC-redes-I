#ifndef UDP_SERVER_H
#define UDP_SERVER_H

#include <Arduino.h>
#include <AsyncUDP.h>
#include "DeviceManager.h"
#include "ConfigManager.h"

class UdpServerWrapper {
private:
    AsyncUDP udp;
    DeviceManager* devMgr;
    FilialConfig* config;
    void handlePacket(AsyncUDPPacket packet);
    String processRequest(const String& payload);

public:
    void begin(FilialConfig* cfg, DeviceManager* mgr);
};

#endif
