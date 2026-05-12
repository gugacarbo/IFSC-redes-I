#include "UdpServer.h"
#include <ArduinoJson.h>

void UdpServerWrapper::begin(FilialConfig* cfg, DeviceManager* mgr) {
    this->config = cfg;
    this->devMgr = mgr;
    
    if (udp.listen(cfg->port)) {
        Serial.printf("UDP Listening on port %d\n", cfg->port);
        udp.onPacket([this](AsyncUDPPacket packet) {
            this->handlePacket(packet);
        });
    }
}

void UdpServerWrapper::handlePacket(AsyncUDPPacket packet) {
    String payload = (const char*)packet.data();
    String response = processRequest(payload);
    if (response.length() > 0) {
        packet.print(response);
    }
}

String UdpServerWrapper::processRequest(const String& payload) {
    JsonDocument req;
    DeserializationError err = deserializeJson(req, payload);
    if (err) return "{\"error\":\"Invalid JSON\"}";

    // 1. Auth check
    if (!req["user"].is<const char*>() || !req["pass"].is<const char*>()) return "{\"error\":\"Missing credentials\"}";
    if (req["user"].as<String>() != config->admin_user || req["pass"].as<String>() != config->admin_pass) return "{\"error\":\"Unauthorized\"}";

    String cmd = req["cmd"] | "";
    JsonDocument res;

    // 2. LIST REQ
    if (cmd == "list_req") {
        res["cmd"] = "list_resp";
        JsonArray ids = res["id"].to<JsonArray>();
        for (const String& d : devMgr->list()) {
            ids.add(d);
        }
        String output;
        serializeJson(res, output);
        return output;
    }

    // 3. GET STATUS
    if (cmd == "get_status") {
        res["cmd"] = "get_resp";
        for (const String& d : devMgr->list()) {
            DeviceState state;
            if (devMgr->get(d, state)) {
                if (state.is_light) res[d] = state.bool_val;
                else res[d] = state.int_val;
            }
        }
        String output;
        serializeJson(res, output);
        return output;
    }

    // 4. SET REQ
    if (cmd == "set_req") {
        String id = req["id"] | "";
        if (id == "") return "{\"error\":\"Missing id\"}";
        
        DeviceState state;
        if (!devMgr->get(id, state)) return "{\"error\":\"Device not found\"}";
        
        // Cannot write to sensors
        if (id.indexOf("sensor_") == 0) return "{\"error\":\"Read only\"}";

        bool success = false;
        if (state.is_light) {
            bool v = req["value"] | false;
            success = devMgr->set(id, v);
            if (success) {
                res["cmd"] = "set_resp";
                res["id"] = id;
                res["value"] = v;
            }
        } else {
            int v = req["value"] | 0;
            success = devMgr->set(id, v);
            if (success) {
                res["cmd"] = "set_resp";
                res["id"] = id;
                res["value"] = v;
            }
        }
        
        if (success) {
            String output;
            serializeJson(res, output);
            return output;
        }
    }

    return "{\"error\":\"Unknown command\"}";
}
