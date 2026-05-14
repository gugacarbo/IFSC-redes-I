#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>

class BridgeManager;

class ApiServer {
private:
	AsyncWebServer server;
	BridgeManager* bridgeManager;
	void setupRoutes();
public:
	ApiServer() : server(80) {}
	void begin();
	void setBridgeManager(BridgeManager* bm) { bridgeManager = bm; }
	AsyncWebServer& getServer() { return server; }
};

#endif
