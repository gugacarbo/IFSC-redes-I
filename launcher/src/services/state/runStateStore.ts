import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface PersistedRunView {
	id: string;
	appName: string;
	scriptLabel: string;
	pid: number | null;
	isRunning: boolean;
	status: string;
}

interface PersistedStatePayload {
	version: 1;
	runs: PersistedRunView[];
}

export interface LoadRunStateResult {
	runs: PersistedRunView[];
	message: string;
}

const STATE_DIR = ".launcher";
const STATE_FILE = "run-state.json";

function getStatePath(repoRoot: string): string {
	return join(repoRoot, STATE_DIR, STATE_FILE);
}

function sanitizeRun(value: unknown): PersistedRunView | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Partial<PersistedRunView>;
	const pid = candidate.pid ?? null;
	const pidValid =
		pid === null ||
		(typeof pid === "number" && Number.isInteger(pid) && pid > 0);

	if (
		typeof candidate.id !== "string" ||
		typeof candidate.appName !== "string" ||
		typeof candidate.scriptLabel !== "string" ||
		typeof candidate.isRunning !== "boolean" ||
		typeof candidate.status !== "string" ||
		!pidValid
	) {
		return null;
	}

	return {
		id: candidate.id,
		appName: candidate.appName,
		scriptLabel: candidate.scriptLabel,
		pid,
		isRunning: candidate.isRunning,
		status: candidate.status,
	};
}

export function loadPersistedRunState(repoRoot: string): LoadRunStateResult {
	const statePath = getStatePath(repoRoot);

	try {
		const raw = readFileSync(statePath, "utf-8");
		const parsed = JSON.parse(raw) as Partial<PersistedStatePayload>;
		if (parsed.version !== 1 || !Array.isArray(parsed.runs)) {
			return {
				runs: [],
				message: "Estado salvo ignorado: formato invalido.",
			};
		}

		const runs = parsed.runs.map(sanitizeRun).filter((run) => run !== null);
		const validRuns = runs as PersistedRunView[];
		if (validRuns.length === 0) {
			return { runs: [], message: "" };
		}

		return {
			runs: validRuns,
			message: `${validRuns.length} terminal(is) restaurado(s) da sessao anterior.`,
		};
	} catch (error) {
		const errno = (error as NodeJS.ErrnoException)?.code;
		if (errno === "ENOENT") {
			return { runs: [], message: "" };
		}
		return {
			runs: [],
			message: "Nao foi possivel ler o estado salvo dos terminais.",
		};
	}
}

export function savePersistedRunState(
	repoRoot: string,
	runs: PersistedRunView[],
): void {
	const payload: PersistedStatePayload = {
		version: 1,
		runs,
	};
	const statePath = getStatePath(repoRoot);
	const stateDir = join(repoRoot, STATE_DIR);
	mkdirSync(stateDir, { recursive: true });
	writeFileSync(statePath, JSON.stringify(payload, null, "\t"), "utf-8");
}
