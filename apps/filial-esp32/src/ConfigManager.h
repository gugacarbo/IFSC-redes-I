#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <vector>

struct FilialConfig {
    uint16_t port;
    String admin_user;
    String admin_pass;
    std::vector<String> devices;
};

class ConfigManager {
public:
    static bool begin();
    static bool loadConfig(FilialConfig& config);
};

#endif
