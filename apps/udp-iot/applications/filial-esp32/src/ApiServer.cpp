#include "ApiServer.h"
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

    // ── Catch-all: DELETE /api/devices/<id> + 404 ──
    server.onNotFound([this](AsyncWebServerRequest *request) {
        if (request->method() == HTTP_DELETE && request->url().startsWith("/api/devices/")) {
            String id = request->url().substring(strlen("/api/devices/"));
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
            return;
        }

        AsyncWebServerResponse *resp = request->beginResponse(404);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
}

void ApiServer::begin(DeviceManager* mgr) {
    devMgr = mgr;
    setupRoutes();
    server.begin();
    Serial.println("ApiServer: HTTP + WebSocket started on port " + String(httpPort));
}
