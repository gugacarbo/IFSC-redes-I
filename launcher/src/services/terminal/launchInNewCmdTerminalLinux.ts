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

	const shellCommand = `cd "${app.path}" && ${scriptCommand}; command_status=$?; echo ""; if [ $command_status -ne 0 ]; then echo "Comando finalizado com erro (exit $command_status)."; fi; printf "Pressione ENTER para fechar... "; read -r _; exit $command_status`;
	const shellArgs = ["sh", "-c", shellCommand];

	let args: string[];

	switch (terminal) {
		case "foot":
			args = [
				"-T",
				`IFSC Launcher | ${app.name} | ${option.label}`,
				"-D",
				app.path,
				"-H",
				...shellArgs,
			];
			break;

		case "gnome-terminal":
			args = [
				"--title",
				`IFSC Launcher | ${app.name} | ${option.label}`,
				"--working-directory",
				app.path,
				"--",
				...shellArgs,
			];
			break;

		case "xterm":
			args = [
				"-hold",
				"-title",
				`IFSC Launcher | ${app.name}`,
				"-e",
				...shellArgs,
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
				...shellArgs,
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
				...shellArgs,
			];
			break;

		case "x-terminal-emulator":
			args = ["-e", ...shellArgs];
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
