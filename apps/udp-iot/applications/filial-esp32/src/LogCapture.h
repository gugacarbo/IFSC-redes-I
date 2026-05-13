#ifndef LOG_CAPTURE_H
#define LOG_CAPTURE_H

#include <Arduino.h>

class LogCapture {
public:
    static void begin(size_t maxEntries = 500);
    static void println(const char* message, const char* level = "info");
    static void error(const char* message);
    static void printf(const char* fmt, ...);
    static String getEntries(int limit);
    static void clear();
    static void setBroadcastCallback(void (*cb)(const char* json));

private:
    static String* entries;
    static String* levels;
    static unsigned long* timestamps;
    static size_t max;
    static size_t head;
    static size_t count;
    static void (*broadcastCb)(const char*);
    static bool inCapture;
    static void addEntry(const char* level, const char* message);
};

#endif
