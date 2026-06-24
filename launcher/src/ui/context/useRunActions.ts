import { useCallback } from "react";
import { stopProcessTree } from "../../services/process/stopProcessTree.js";
import { executeScriptOptionInBackground } from "../../services/runner.js";
import type { AppInfo, ScriptOption } from "../../types.js";
import type { LauncherContextValue, Screen } from "./types.js";

export function useRunActions(
	context: Pick<
		LauncherContextValue,
		| "setScreen"
		| "setRunReturnScreen"
		| "setRunViews"
		| "setSelectedRunIndex"
		| "setStatusMessage"
		| "runningHandlesRef"
		| "runViews"
		| "selectedRunIndex"
	>,
) {
	const {
		setScreen,
		setRunReturnScreen,
		setRunViews,
		setSelectedRunIndex,
		setStatusMessage,
		runningHandlesRef,
		runViews,
		selectedRunIndex,
	} = context;

	const startExternalTerminal = useCallback(
		(app: AppInfo, option: ScriptOption): void => {
			const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			setScreen("run" as Screen);
			setRunReturnScreen("scripts" as Screen);
			setRunViews((prev) => {
				const nextRuns = [
					...prev,
					{
						id: runId,
						appName: app.name,
						scriptLabel: option.label,
						pid: null as unknown as number,
						isRunning: true,
						status: `Abrindo terminal para ${app.name} -> ${option.label}...`,
					},
				];
				setSelectedRunIndex(nextRuns.length - 1);
				return nextRuns;
			});
			setStatusMessage("");

			const handle = executeScriptOptionInBackground(app, option, {
				onStatus: (status) => {
					setRunViews((prev) =>
						prev.map((run) => (run.id === runId ? { ...run, status } : run)),
					);
				},
				onPid: (pid) => {
					setRunViews((prev) =>
						prev.map((run) => (run.id === runId ? { ...run, pid } : run)),
					);
				},
				onFinish: (_success, message) => {
					runningHandlesRef.current.delete(runId);
					setRunViews((prev) =>
						prev.map((run) =>
							run.id === runId
								? { ...run, isRunning: false, status: message }
								: run,
						),
					);
				},
			});
			runningHandlesRef.current.set(runId, handle);
		},
		[
			setScreen,
			setRunReturnScreen,
			setRunViews,
			setSelectedRunIndex,
			setStatusMessage,
			runningHandlesRef,
		],
	);

	const stopSelectedRun = useCallback((): void => {
		const selectedRun = runViews[selectedRunIndex];
		if (!selectedRun) {
			setStatusMessage("Nenhum terminal selecionado.");
			return;
		}
		if (!selectedRun.isRunning) {
			setStatusMessage("O terminal selecionado ja foi finalizado.");
			return;
		}
		const handle = runningHandlesRef.current.get(selectedRun.id);
		if (!handle) {
			if (selectedRun.pid && selectedRun.pid > 0) {
				setStatusMessage(
					`Encerrando terminal restaurado (PID ${selectedRun.pid})...`,
				);
				stopProcessTree(selectedRun.pid);
				return;
			}
			setStatusMessage("Handle do terminal nao encontrado.");
			return;
		}
		handle.stop();
	}, [runViews, selectedRunIndex, setStatusMessage, runningHandlesRef]);

	const stopAllRunningRuns = useCallback((): void => {
		let stopped = 0;
		for (const run of runViews) {
			if (!run.isRunning) continue;
			const handle = runningHandlesRef.current.get(run.id);
			if (handle) {
				handle.stop();
				stopped += 1;
				continue;
			}
			if (run.pid && run.pid > 0) {
				stopProcessTree(run.pid);
				stopped += 1;
			}
		}
		setStatusMessage(
			stopped > 0
				? `${stopped} terminal(is) em encerramento.`
				: "Nenhum terminal em execucao para encerrar.",
		);
	}, [runViews, setStatusMessage, runningHandlesRef]);

	const clearFinishedRuns = useCallback((): void => {
		let removed = 0;
		setRunViews((prev) => {
			const next = prev.filter((run) => run.isRunning);
			removed = prev.length - next.length;
			return next;
		});
		setSelectedRunIndex(0);
		setStatusMessage(
			removed > 0
				? `${removed} terminal(is) finalizado(s) removido(s) da lista.`
				: "Nenhum terminal finalizado para limpar.",
		);
	}, [setRunViews, setSelectedRunIndex, setStatusMessage]);

	return {
		startExternalTerminal,
		stopSelectedRun,
		stopAllRunningRuns,
		clearFinishedRuns,
	};
}
