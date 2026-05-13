#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>

class ConfigManager {
public:
	static bool begin();
	static String getConfigJson();
	static bool saveConfig(const String& body);
};

#endif
