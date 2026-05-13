import { spawn } from "node:child_process";
import type { AppInfo, ScriptOption } from "../../types.js";
import { buildCommandForOption } from "./buildCommandForOption.js";
import { detectTerminal } from "./detectTerminal.js";

export function launchInNewCmdTerminalLinux(
	app: AppInfo,
	option: ScriptOption,
): number {
	const scriptCommand = buildCommandForOption(app, option);
	const terminal = detectTerminal();

	const shellCommand = `cd "${app.path}" && ${scriptCommand}; echo ""; echo "Pressione ENTER para fechar..."; read`;

	let args: string[];

	switch (terminal) {
		case "gnome-terminal":
			args = [
				"--disable-factory",
				"--title",
				`IFSC Launcher | ${app.name} | ${option.label}`,
				"--working-directory",
				app.path,
				"--",
				"sh",
				"-c",
				shellCommand,
			];
			break;

		case "xterm":
			args = [
				"-hold",
				"-title",
				`IFSC Launcher | ${app.name}`,
				"-e",
				shellCommand,
			];
			break;

		case "konsole":
			args = [
				"--hold",
				"--title",
				`IFSC Launcher | ${app.name}`,
				"--workdir",
				app.path,
				"-e",
				shellCommand,
			];
			break;

		case "xfce4-terminal":
		case "lxterminal":
		case "mate-terminal":
			args = [
				"--title",
				`IFSC Launcher | ${app.name}`,
				"--working-directory",
				app.path,
				"-e",
				shellCommand,
			];
			break;

		case "x-terminal-emulator":
			args = ["-e", shellCommand];
			break;

		default:
			throw new Error(
				`Terminal ${terminal} nao suportado para abertura externa.`,
			);
	}

	const child = spawn(terminal, args, {
		stdio: "ignore",
		detached: true,
	});
	child.unref();

	return child.pid ?? -1;
}
