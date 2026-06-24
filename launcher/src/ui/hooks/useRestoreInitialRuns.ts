import { useEffect, useRef } from "react";
import { isProcessAlive } from "../../services/process/isProcessAlive.js";
import type { BackgroundRunHandle } from "../../services/runner.js";
import { attachToExistingTerminalRun } from "../../services/runner.js";
import type { RunViewState } from "../context/types.js";

interface PersistedRunView {
	id: string;
	appName: string;
	scriptLabel: string;
	pid: number | null;
	isRunning: boolean;
	status: string;
}

export function useRestoreInitialRuns(
	initialRunViews: PersistedRunView[],
	runningHandlesRef: React.MutableRefObject<Map<string, BackgroundRunHandle>>,
	setRunViews: React.Dispatch<React.SetStateAction<RunViewState[]>>,
) {
	const restored = useRef(false);

	useEffect(() => {
		if (restored.current) return;
		restored.current = true;

		for (const run of initialRunViews) {
			if (!run.isRunning || !run.pid || run.pid <= 0) continue;
			if (runningHandlesRef.current.has(run.id)) continue;
			if (!isProcessAlive(run.pid)) {
				setRunViews((prev) =>
					prev.map((entry) =>
						entry.id === run.id
							? {
									...entry,
									isRunning: false,
									status: "Terminal nao estava mais em execucao.",
								}
							: entry,
					),
				);
				continue;
			}
			const pid = run.pid;
			const handle = attachToExistingTerminalRun(pid, {
				onStatus: (status) => {
					setRunViews((prev) =>
						prev.map((entry) =>
							entry.id === run.id ? { ...entry, status } : entry,
						),
					);
				},
				onFinish: (_success, message) => {
					runningHandlesRef.current.delete(run.id);
					setRunViews((prev) =>
						prev.map((entry) =>
							entry.id === run.id
								? { ...entry, isRunning: false, status: message }
								: entry,
						),
					);
				},
			});
			runningHandlesRef.current.set(run.id, handle);
			setRunViews((prev) =>
				prev.map((entry) =>
					entry.id === run.id
						? { ...entry, status: `Terminal restaurado (PID ${pid}).` }
						: entry,
				),
			);
		}
	}, [initialRunViews, runningHandlesRef, setRunViews]);
}
