import { spawnSync } from "node:child_process";

const CANDIDATES = [
	"gnome-terminal",
	"x-terminal-emulator",
	"xterm",
	"konsole",
	"xfce4-terminal",
	"lxterminal",
	"mate-terminal",
] as const;

const CACHE = new Map<string, string | null>();

export function detectTerminal(): string {
	const cached = CACHE.get("terminal");
	if (cached === undefined) {
		// not cached yet — probe
		for (const cmd of CANDIDATES) {
			const result = spawnSync("which", [cmd], {
				encoding: "utf-8",
				stdio: "pipe",
			});
			if (result.status === 0) {
				CACHE.set("terminal", cmd);
				return cmd;
			}
		}
		CACHE.set("terminal", null);
		throw new Error(
			"Nenhum terminal encontrado. Instale gnome-terminal, xterm, konsole ou xfce4-terminal.",
		);
	}
	if (cached === null) {
		throw new Error(
			"Nenhum terminal encontrado. Instale gnome-terminal, xterm, konsole ou xfce4-terminal.",
		);
	}
	return cached;
}
