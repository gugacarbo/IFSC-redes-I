import type { AppInfo, ScriptOption } from "../types.js";
import { isProcessAlive } from "./process/isProcessAlive.js";
import { stopProcessTree } from "./process/stopProcessTree.js";
import { launchInNewCmdTerminal } from "./terminal/launchInNewCmdTerminal.js";

interface RunHooks {
	onStatus?: (status: string) => void;
	onPid?: (pid: number) => void;
	onFinish?: (success: boolean, message: string) => void;
}

export interface BackgroundRunHandle {
	stop: () => void;
}

const MONITOR_INTERVAL_MS = 1200;

export function executeScriptOptionInBackground(
	app: AppInfo,
	option: ScriptOption,
	hooks: RunHooks = {},
): BackgroundRunHandle {
	let pid: number | null = null;
	let finished = false;
	let stopRequested = false;
	let monitorTimer: NodeJS.Timeout | null = null;

	const finish = (success: boolean, message: string): void => {
		if (finished) {
			return;
		}
		finished = true;
		if (monitorTimer) {
			clearInterval(monitorTimer);
			monitorTimer = null;
		}
		hooks.onStatus?.(message);
		hooks.onFinish?.(success, message);
	};

	try {
		hooks.onStatus?.(
			`Abrindo novo terminal para ${app.name} -> ${option.label}...`,
		);
		pid = launchInNewCmdTerminal(app, option);
		hooks.onPid?.(pid);
		hooks.onStatus?.(`Terminal aberto (PID ${pid}).`);

		monitorTimer = setInterval(() => {
			if (!pid || finished) {
				return;
			}

			if (!isProcessAlive(pid)) {
				if (stopRequested) {
					finish(true, "Terminal encerrado pelo launcher.");
					return;
				}
				finish(true, "Terminal foi fechado.");
			}
		}, MONITOR_INTERVAL_MS);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Falha ao iniciar execucao.";
		finish(false, message);
	}

	return {
		stop: () => {
			if (finished || !pid) {
				return;
			}
			stopRequested = true;
			hooks.onStatus?.(`Encerrando terminal (PID ${pid})...`);
			stopProcessTree(pid);
		},
	};
}
