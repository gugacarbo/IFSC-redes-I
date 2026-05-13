#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>

class ApiServer {
private:
	AsyncWebServer server;
	void setupRoutes();
public:
	ApiServer() : server(80) {}
	void begin();
	AsyncWebServer& getServer() { return server; }
};

#endif
