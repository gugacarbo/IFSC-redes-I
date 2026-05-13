#include "BridgeManager.h"
#include "ConfigManager.h"
#include <ArduinoJson.h>

void BridgeManager::begin(AsyncWebServer& server) {
	if (udp.listen(0)) {
		udp.onPacket([this](AsyncUDPPacket packet) {
			this->handleUdpPacket(packet);
		});
	}

	ws.onEvent([this](AsyncWebSocket* srv, AsyncWebSocketClient* client, AwsEventType type, void* arg, uint8_t* data, size_t len) {
		if (type == WS_EVT_DATA) {
			AwsFrameInfo* info = (AwsFrameInfo*)arg;
			if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
				this->handleWsMessage(arg, data, len);
			}
		}
	});
	server.addHandler(&ws);
}

void BridgeManager::handleWsMessage(void* arg, uint8_t* data, size_t len) {
	String msg;
	msg.concat((const char*)data, len);

	JsonDocument doc;
	if (deserializeJson(doc, msg)) return;

	String type = doc["type"] | "";
	if (type == "ws_tx") {
		String targetIp = doc["target_ip"] | "";

		MatrizConfig& cfg = ConfigManager::getConfig();
		doc["payload"]["user"] = cfg.user;
		doc["payload"]["pass"] = cfg.pass;

		uint16_t port = 51000;
		for (auto& f : cfg.filiais) {
			if (f.ip == targetIp) port = f.port;
		}

		String udpOut;
		serializeJson(doc["payload"], udpOut);

		IPAddress ip;
		if (ip.fromString(targetIp)) {
			udp.writeTo((const uint8_t*)udpOut.c_str(), udpOut.length(), ip, port);
		}
	}
}

void BridgeManager::handleUdpPacket(AsyncUDPPacket packet) {
	String payload;
	payload.concat((const char*)packet.data(), packet.length());
	String sourceIp = packet.remoteIP().toString();

	JsonDocument out;
	out["type"] = "ws_rx";
	out["source_ip"] = sourceIp;

	JsonDocument parsedPayload;
	if (!deserializeJson(parsedPayload, payload)) {
		out["payload"] = parsedPayload;

		String wsOut;
		serializeJson(out, wsOut);
		ws.textAll(wsOut);
	}
}

void BridgeManager::loop() {
	MatrizConfig& cfg = ConfigManager::getConfig();
	if (cfg.polling_ms == 0 || cfg.filiais.empty()) return;

	if (millis() - lastPollTime >= cfg.polling_ms) {
		lastPollTime = millis();

		for (auto& filial : cfg.filiais) {
			IPAddress ip;
			if (ip.fromString(filial.ip)) {
				JsonDocument listReq;
				listReq["cmd"] = "list_req";
				listReq["user"] = cfg.user;
				listReq["pass"] = cfg.pass;
				String lOut;
				serializeJson(listReq, lOut);
				udp.writeTo((const uint8_t*)lOut.c_str(), lOut.length(), ip, filial.port);

				JsonDocument statReq;
				statReq["cmd"] = "get_status";
				statReq["user"] = cfg.user;
				statReq["pass"] = cfg.pass;
				String sOut;
				serializeJson(statReq, sOut);
				udp.writeTo((const uint8_t*)sOut.c_str(), sOut.length(), ip, filial.port);
			}
		}
	}
}

void BridgeManager::sendUdpCommand(const String& ip, uint16_t port, const String& payload) {
	IPAddress addr;
	if (addr.fromString(ip)) {
		udp.writeTo((const uint8_t*)payload.c_str(), payload.length(), addr, port);
	}
}
