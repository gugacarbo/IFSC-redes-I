#include "ApiServer.h"
#include "ConfigManager.h"
#include "LogCapture.h"
#include "BridgeManager.h"
#include <LittleFS.h>

extern BridgeManager* g_bridgeManager;  // Set in main.cpp

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
				// Reset poll timer so new polling_ms takes effect immediately
				if (g_bridgeManager) g_bridgeManager->resetPollTimer();
				resp = request->beginResponse(200, "application/json", "{\"status\":\"ok\"}");
			} else {
				resp = request->beginResponse(400, "application/json", "{\"error\":\"Invalid format\"}");
			}
			resp->addHeader("Access-Control-Allow-Origin", "*");
			request->send(resp);
		}
	);

	// ── GET /api/logs ──
	server.on("/api/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
		int limit = 200;
		if (request->hasParam("limit")) {
			limit = request->getParam("limit")->value().toInt();
			if (limit < 1) limit = 1;
			if (limit > 500) limit = 500;
		}
		String json = LogCapture::getEntries(limit);
		AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
		resp->addHeader("Access-Control-Allow-Origin", "*");
		request->send(resp);
	});

	server.on("/api/logs", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
		AsyncWebServerResponse *resp = request->beginResponse(200);
		resp->addHeader("Access-Control-Allow-Origin", "*");
		resp->addHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
		resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
		request->send(resp);
	});

	server.serveStatic("/", LittleFS, "/www/").setDefaultFile("index.html");
}

void ApiServer::begin() {
	setupRoutes();
	server.begin();
	Serial.println("HTTP server started");
}
