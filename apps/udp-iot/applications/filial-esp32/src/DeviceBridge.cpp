#include "DeviceBridge.h"
#include <ArduinoJson.h>

void DeviceBridge::begin(AsyncWebServer& server, DeviceManager* mgr) {
    devMgr = mgr;

    ws.onEvent([this](AsyncWebSocket* srv, AsyncWebSocketClient* client,
                      AwsEventType type, void* arg, uint8_t* data, size_t len) {
        if (type == WS_EVT_DATA) {
            AwsFrameInfo* info = (AwsFrameInfo*)arg;
            if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
                this->handleWsMessage(arg, data, len);
            }
        }
    });

    server.addHandler(&ws);
}

void DeviceBridge::handleWsMessage(void* arg, uint8_t* data, size_t len) {
    String msg;
    msg.concat((const char*)data, len);

    JsonDocument doc;
    if (deserializeJson(doc, msg)) return;

    String type = doc["type"] | "";

    if (type == "set_device") {
        String id = doc["id"] | "";
        if (id.isEmpty()) return;

        DeviceState state;
        if (!devMgr->get(id, state)) return;

        // sensor = read-only
        if (id.indexOf("sensor_") == 0) return;

        if (state.is_light) {
            devMgr->set(id, doc["value"].as<bool>());
        } else {
            devMgr->set(id, doc["value"].as<int>());
        }
        broadcastDevicesUpdated();
    }
    else if (type == "add_device") {
        String id = doc["id"] | "";
        if (id.isEmpty()) return;
        if (devMgr->addDevice(id)) {
            broadcastDevicesUpdated();
        }
    }
    else if (type == "remove_device") {
        String id = doc["id"] | "";
        if (id.isEmpty()) return;
        if (devMgr->removeDevice(id)) {
            broadcastDevicesUpdated();
        }
    }
}

void DeviceBridge::broadcast(const char* json) {
    ws.textAll(json);
}

void DeviceBridge::broadcastDevicesUpdated() {
    String json = "{\"type\":\"devices_updated\",\"devices\":";
    json += devMgr->getAllJson();
    json += "}";
    ws.textAll(json);
}
