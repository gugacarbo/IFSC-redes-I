#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <vector>

struct FilialInfo {
	String name;
	String ip;
	uint16_t port;
};

struct MatrizConfig {
	String user;
	String pass;
	uint32_t polling_ms;
	std::vector<FilialInfo> filiais;
};

class ConfigManager {
public:
	static bool begin();
	static String getConfigJson();
	static bool saveConfig(const String& body);
	static MatrizConfig& getConfig();
};

#endif
