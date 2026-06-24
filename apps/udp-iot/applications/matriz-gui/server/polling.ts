import { currentConfig } from "./config.js";
import { sendUdp } from "./udp.js";

export function pollAll() {
	for (const filial of currentConfig.filiais) {
		sendUdp(filial.ip, filial.port, {
			cmd: "list_req",
			user: currentConfig.user,
			pass: currentConfig.pass,
		});
		sendUdp(filial.ip, filial.port, {
			cmd: "get_status",
			user: currentConfig.user,
			pass: currentConfig.pass,
		});
	}
}

let pollingInterval: NodeJS.Timeout | null = null;

export function startPolling() {
	if (pollingInterval) clearInterval(pollingInterval);
	pollAll();
	pollingInterval = setInterval(pollAll, currentConfig.pollingMs);
}
