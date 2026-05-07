import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { AppInfo, ScriptOption } from "../types.js";

function findRepoRoot(fromDir: string): string {
	let current = resolve(fromDir);

	while (true) {
		if (
			existsSync(join(current, "apps")) &&
			existsSync(join(current, "package.json"))
		) {
			return current;
		}

		const parent = dirname(current);
		if (parent === current) {
			throw new Error("Could not locate repository root.");
		}

		current = parent;
	}
}

export function getRepoRoot(): string {
	const candidates = [process.cwd(), dirname(process.execPath)];

	for (const candidate of candidates) {
		try {
			return findRepoRoot(candidate);
		} catch {
			// Try next candidate.
		}
	}

	throw new Error(
		`Nao foi possivel localizar a raiz do repositorio. Tentativas: ${candidates.join(", ")}`,
	);
}

export function getApps(repoRoot: string): AppInfo[] {
	const appsDir = join(repoRoot, "apps");
	const entries = readdirSync(appsDir, { withFileTypes: true });

	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => {
			const pkgPath = join(appsDir, entry.name, "package.json");
			try {
				const raw = readFileSync(pkgPath, "utf-8");
				const pkg = JSON.parse(raw) as {
					name?: string;
					description?: string;
					scripts?: Record<string, string>;
				};

				return {
					name: pkg.name ?? entry.name,
					description: pkg.description ?? "Sem descricao",
					path: join(appsDir, entry.name),
					scripts: Object.keys(pkg.scripts ?? {}),
				} satisfies AppInfo;
			} catch {
				return null;
			}
		})
		.filter((app): app is AppInfo => app !== null)
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function getScriptOptions(app: AppInfo): ScriptOption[] {
	const options: ScriptOption[] = app.scripts.map((script) => ({
		id: script,
		label: script,
		type: "script",
	}));

	if (!options.some((option) => option.id === "start")) {
		options.unshift({
			id: "start",
			label: "start (build + run no terminal atual)",
			type: "start",
		});
	}

	return options;
}
