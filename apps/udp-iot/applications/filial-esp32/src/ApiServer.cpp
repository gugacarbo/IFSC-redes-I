#include "ApiServer.h"
#include "LogCapture.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

void ApiServer::setupRoutes() {
    // ── CORS preflight ──
    auto cors = [](AsyncWebServerRequest *request) {
        AsyncWebServerResponse *resp = request->beginResponse(204);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
        request->send(resp);
    };

    server.on("/api/devices", HTTP_OPTIONS, cors);
    server.on("/api/config",  HTTP_OPTIONS, cors);
    server.on("/health",      HTTP_OPTIONS, cors);

    // ── GET /api/devices ──
    server.on("/api/devices", HTTP_GET, [this](AsyncWebServerRequest *request) {
        String json = devMgr->getAllJson();
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });

    // ── POST /api/devices (add) ──
    server.on("/api/devices", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [this](AsyncWebServerRequest *request, uint8_t *data, size_t len,
               size_t index, size_t total) {
            String body;
            body.reserve(len);
            for (size_t i = 0; i < len; i++) body += (char)data[i];

            JsonDocument doc;
            if (deserializeJson(doc, body)) {
                AsyncWebServerResponse *resp = request->beginResponse(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                resp->addHeader("Access-Control-Allow-Origin", "*");
                request->send(resp);
                return;
            }

            String id = doc["id"] | "";
            if (id.isEmpty()) {
                AsyncWebServerResponse *resp = request->beginResponse(400, "application/json", "{\"error\":\"Missing id\"}");
                resp->addHeader("Access-Control-Allow-Origin", "*");
                request->send(resp);
                return;
            }

            devMgr->addDevice(id);

            String json = "{\"id\":\"" + id + "\"}";
            AsyncWebServerResponse *resp = request->beginResponse(201, "application/json", json);
            resp->addHeader("Access-Control-Allow-Origin", "*");
            request->send(resp);
        }
    );

    // ── DELETE /api/devices/<id> ──
    server.on("/api/devices/{id}", HTTP_DELETE, [this](AsyncWebServerRequest *request) {
        String id = request->pathArg(0);
        bool removed = devMgr->removeDevice(id);

        if (!removed) {
            AsyncWebServerResponse *resp = request->beginResponse(404, "application/json", "{\"error\":\"Device not found\"}");
            resp->addHeader("Access-Control-Allow-Origin", "*");
            request->send(resp);
            return;
        }

        String json = "{\"id\":\"" + id + "\",\"removed\":true}";
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });

    // ── GET /api/config ──
    server.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request) {
        String json = "{\"port\":0,\"adminUser\":\"admin\",\"adminPass\":\"admin\",\"deviceCount\":0}";
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });

    // ── GET /health ──
    server.on("/health", HTTP_GET, [this](AsyncWebServerRequest *request) {
        String json = "{\"status\":\"ok\",\"devices\":" + String(devMgr->list().size()) + "}";
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", json);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });

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

    server.on("/api/logs", HTTP_OPTIONS, cors);
}

void ApiServer::begin(DeviceManager* mgr) {
    devMgr = mgr;
    setupRoutes();
    server.begin();
    Serial.println("ApiServer: HTTP + WebSocket started on port " + String(httpPort));
}
