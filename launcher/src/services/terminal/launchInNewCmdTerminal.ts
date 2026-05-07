import { spawnSync } from "node:child_process";
import type { AppInfo, ScriptOption } from "../../types.js";
import { buildCommandForOption } from "./buildCommandForOption.js";
import { escapePowerShellSingleQuoted } from "./escapePowerShellSingleQuoted.js";
import { sanitizeWindowTitle } from "./sanitizeWindowTitle.js";

export function launchInNewCmdTerminal(
	app: AppInfo,
	option: ScriptOption,
): number {
	if (process.platform !== "win32") {
		throw new Error(
			"Abertura de terminal externo implementada apenas para Windows.",
		);
	}

	const scriptCommand = buildCommandForOption(app, option);
	const windowTitle = sanitizeWindowTitle(
		`IFSC Launcher | ${app.name} | ${option.label}`,
	);
	const cmdLine = `title ${windowTitle} && ${scriptCommand}`;

	const psScript = [
		`$p = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/k', '${escapePowerShellSingleQuoted(cmdLine)}') -WorkingDirectory '${escapePowerShellSingleQuoted(
			app.path,
		)}' -PassThru`,
		"Write-Output $p.Id",
	].join("; ");

	const result = spawnSync("powershell", ["-NoProfile", "-Command", psScript], {
		encoding: "utf-8",
	});

	if (result.status !== 0) {
		const stderr = result.stderr?.trim() ?? "";
		throw new Error(
			stderr
				? `Falha ao abrir terminal: ${stderr}`
				: "Falha ao abrir terminal.",
		);
	}

	const rawPid = (result.stdout ?? "").trim();
	const pid = Number.parseInt(rawPid, 10);
	if (!Number.isInteger(pid) || pid <= 0) {
		throw new Error(
			`Nao foi possivel obter PID do terminal. Saida: '${rawPid || "<vazio>"}'`,
		);
	}

	return pid;
}
