#ifndef BRIDGE_MANAGER_H
#define BRIDGE_MANAGER_H

#include <Arduino.h>
#include <AsyncUDP.h>
#include <ESPAsyncWebServer.h>

class BridgeManager {
private:
	AsyncUDP udp;
	AsyncWebSocket ws;
	uint32_t lastPollTime;

	void handleUdpPacket(AsyncUDPPacket packet);
	void handleWsMessage(void* arg, uint8_t* data, size_t len);

public:
	BridgeManager() : ws("/ws"), lastPollTime(0) {}
	void begin(AsyncWebServer& server);
	void loop();
	void sendUdpCommand(const String& ip, uint16_t port, const String& payload);
};

#endif
