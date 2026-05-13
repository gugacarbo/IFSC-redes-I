#include "ApiServer.h"
#include "ConfigManager.h"
#include <LittleFS.h>

void ApiServer::setupRoutes() {
	server.on("/api/config", HTTP_OPTIONS, [](AsyncWebServerRequest *request){
		AsyncWebServerResponse *resp = request->beginResponse(200);
		resp->addHeader("Access-Control-Allow-Origin", "*");
		resp->addHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
		resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
		request->send(resp);
	});

	server.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request){
		AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", ConfigManager::getConfigJson());
		resp->addHeader("Access-Control-Allow-Origin", "*");
		request->send(resp);
	});

	server.on("/api/config", HTTP_PUT,
		[](AsyncWebServerRequest *request){},
		NULL,
		[](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
			String body;
			body.reserve(len);
			for (size_t i = 0; i < len; i++) body += (char)data[i];

			AsyncWebServerResponse *resp;
			if (ConfigManager::saveConfig(body)) {
				resp = request->beginResponse(200, "application/json", "{\"status\":\"ok\"}");
			} else {
				resp = request->beginResponse(400, "application/json", "{\"error\":\"Invalid format\"}");
			}
			resp->addHeader("Access-Control-Allow-Origin", "*");
			request->send(resp);
		}
	);

	server.serveStatic("/", LittleFS, "/www/").setDefaultFile("index.html");
}

void ApiServer::begin() {
	setupRoutes();
	server.begin();
	Serial.println("HTTP server started");
}
