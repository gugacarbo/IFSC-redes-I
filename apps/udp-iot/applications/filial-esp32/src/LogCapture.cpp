#include "LogCapture.h"
#include <stdarg.h>

String* LogCapture::entries = nullptr;
String* LogCapture::levels = nullptr;
unsigned long* LogCapture::timestamps = nullptr;
size_t LogCapture::max = 500;
size_t LogCapture::head = 0;
size_t LogCapture::count = 0;
void (*LogCapture::broadcastCb)(const char*) = nullptr;
bool LogCapture::inCapture = false;

void LogCapture::begin(size_t maxEntries) {
    max = maxEntries;
    entries = new String[max];
    levels = new String[max];
    timestamps = new unsigned long[max];
    head = 0;
    count = 0;
}

void LogCapture::addEntry(const char* level, const char* message) {
    if (inCapture) return;
    inCapture = true;

    entries[head] = String(message);
    levels[head] = String(level);
    timestamps[head] = millis();
    head = (head + 1) % max;
    if (count < max) count++;

    if (broadcastCb) {
        String json = "{\"type\":\"log\",\"level\":\"";
        json += level;
        json += "\",\"message\":\"";
        for (const char* p = message; *p; p++) {
            if (*p == '"') json += "\\\"";
            else if (*p == '\\') json += "\\\\";
            else if (*p == '\n') json += "\\n";
            else if (*p == '\r') json += "\\r";
            else if (*p == '\t') json += "\\t";
            else json += *p;
        }
        json += "\",\"ts\":";
        json += String(timestamps[(head - 1 + max) % max]);
        json += "}";
        broadcastCb(json.c_str());
    }

    inCapture = false;
}

void LogCapture::println(const char* message, const char* level) {
    Serial.println(message);
    addEntry(level, message);
}

void LogCapture::error(const char* message) {
    Serial.println(message);
    addEntry("error", message);
}

void LogCapture::printf(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    char buf[256];
    vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);
    Serial.print(buf);
    addEntry("info", buf);
}

String LogCapture::getEntries(int limit) {
    String result = "[";
    bool first = true;
    size_t start = (count < max) ? 0 : head;
    size_t total = (count < max) ? count : max;
    size_t limit_count = (limit > 0 && (size_t)limit < total) ? limit : total;

    for (size_t i = 0; i < limit_count; i++) {
        size_t idx = (start + total - 1 - i) % max;
        if (!first) result += ",";
        first = false;
        result += "{\"level\":\"";
        result += levels[idx];
        result += "\",\"message\":\"";
        const String& msg = entries[idx];
        for (size_t c = 0; c < msg.length(); c++) {
            char ch = msg.charAt(c);
            if (ch == '"') result += "\\\"";
            else if (ch == '\\') result += "\\\\";
            else if (ch == '\n') result += "\\n";
            else if (ch == '\r') result += "\\r";
            else if (ch == '\t') result += "\\t";
            else result += ch;
        }
        result += "\",\"ts\":";
        result += String(timestamps[idx]);
        result += "}";
    }
    result += "]";
    return result;
}

void LogCapture::clear() {
    head = 0;
    count = 0;
}

void LogCapture::setBroadcastCallback(void (*cb)(const char*)) {
    broadcastCb = cb;
}
