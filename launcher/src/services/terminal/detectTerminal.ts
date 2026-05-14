import { spawnSync } from "node:child_process";

const CANDIDATES = [
	"foot",
	"gnome-terminal",
	"x-terminal-emulator",
	"xterm",
	"konsole",
	"xfce4-terminal",
	"lxterminal",
	"mate-terminal",
] as const;

const CACHE = new Map<string, string | null>();

function probeArgsForTerminal(command: string): string[] {
	if (command === "foot") {
		return ["-D", process.cwd(), "sh", "-c", "true"];
	}

	if (command === "gnome-terminal") {
		// Real probe: catches runtime linker/snap issues that --help may hide.
		return ["--wait", "--", "sh", "-c", "true"];
	}

	if (
		command === "x-terminal-emulator" ||
		command === "xterm" ||
		command === "konsole"
	) {
		return ["-e", "sh", "-c", "true"];
	}

	return ["--help"];
}

function isRunnableTerminal(command: string): boolean {
	const result = spawnSync(command, probeArgsForTerminal(command), {
		encoding: "utf-8",
		stdio: "pipe",
		timeout: 8000,
	});

	if (result.error) {
		return false;
	}

	// Some emulators may return 1 for --help, but 127 is a shell/runtime failure.
	if (result.status === 127) {
		return false;
	}

	return true;
}

export function detectTerminal(): string {
	const cached = CACHE.get("terminal");
	if (cached === undefined) {
		const failedCandidates: string[] = [];

		for (const cmd of CANDIDATES) {
			const exists = spawnSync("which", [cmd], {
				encoding: "utf-8",
				stdio: "pipe",
			});

			if (exists.status !== 0) {
				continue;
			}

			if (isRunnableTerminal(cmd)) {
				CACHE.set("terminal", cmd);
				return cmd;
			}

			failedCandidates.push(cmd);
		}

		CACHE.set("terminal", null);
		throw new Error(
			failedCandidates.length > 0
				? `Terminais encontrados, mas indisponiveis no momento: ${failedCandidates.join(", ")}.`
				: "Nenhum terminal encontrado. Instale gnome-terminal, xterm, konsole ou xfce4-terminal.",
		);
	}
	if (cached === null) {
		throw new Error(
			"Nenhum terminal encontrado. Instale gnome-terminal, xterm, konsole ou xfce4-terminal.",
		);
	}
	return cached;
}
