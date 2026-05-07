import readline from "node:readline";
import { render } from "ink";
import { getApps, getRepoRoot } from "./data/apps.js";
import { LauncherApp } from "./ui/LauncherApp.js";

let restoreTerminalState: (() => void) | null = null;

function enterFullscreenTerminal(): void {
	if (!process.stdout.isTTY) {
		return;
	}

	// Use alternate screen buffer so the launcher owns the whole terminal area.
	process.stdout.write("\u001B[?1049h");
	process.stdout.write("\u001B[2J\u001B[H");
	process.stdout.write("\u001B[?25l");

	let restored = false;
	restoreTerminalState = () => {
		if (restored || !process.stdout.isTTY) {
			return;
		}
		restored = true;
		process.stdout.write("\u001B[?25h");
		process.stdout.write("\u001B[?1049l");
	};
}

function main(): void {
	const repoRoot = getRepoRoot();
	const apps = getApps(repoRoot);
	enterFullscreenTerminal();
	const instance = render(<LauncherApp apps={apps} />);
	instance.waitUntilExit().finally(() => {
		restoreTerminalState?.();
	});
}

function waitForEnterOnFatalError(): Promise<void> {
	return new Promise((resolve) => {
		if (!process.stdin.isTTY) {
			resolve();
			return;
		}

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question("\nPressione Enter para fechar...", () => {
			rl.close();
			resolve();
		});
	});
}

async function bootstrap(): Promise<void> {
	try {
		process.on("exit", () => restoreTerminalState?.());
		process.on("SIGTERM", () => {
			restoreTerminalState?.();
			process.exit(143);
		});
		main();
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Erro desconhecido.";
		restoreTerminalState?.();
		console.error(`\nFalha ao iniciar o launcher: ${message}`);
		await waitForEnterOnFatalError();
		process.exit(1);
	}
}

void bootstrap();
