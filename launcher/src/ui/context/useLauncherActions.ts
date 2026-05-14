import { useCallback } from "react";
import { getApps, getRepoRoot } from "../../data/apps.js";
import { createApp } from "../../services/appCreator/createApp.js";
import type { LanguageTemplate } from "../../services/appCreator/types.js";
import { stopProcessTree } from "../../services/process/stopProcessTree.js";
import { executeScriptOptionInBackground } from "../../services/runner.js";
import type { AppInfo, ScriptOption } from "../../types.js";
import { readAppDocs } from "../docs/readAppDocs.js";
import type { LauncherContextValue, Screen } from "./LauncherContext.js";

export function useLauncherActions(
	context: Pick<
		LauncherContextValue,
		| "apps"
		| "setApps"
		| "selectedApp"
		| "setPreviousScreen"
		| "setDocsContent"
		| "setDocsScrollOffset"
		| "setScreen"
		| "setRunReturnScreen"
		| "setRunViews"
		| "setSelectedRunIndex"
		| "setStatusMessage"
		| "runningHandlesRef"
		| "runViews"
		| "selectedRunIndex"
		| "createAppName"
		| "setCreateAppName"
		| "selectedLanguageIndex"
		| "setSelectedLanguageIndex"
		| "languageTemplates"
		| "setSelectedAppIndex"
	>,
) {
	const {
		apps,
		setApps,
		selectedApp,
		setPreviousScreen,
		setDocsContent,
		setDocsScrollOffset,
		setScreen,
		setRunReturnScreen,
		setRunViews,
		setSelectedRunIndex,
		setStatusMessage,
		runningHandlesRef,
		runViews,
		selectedRunIndex,
		createAppName,
		setCreateAppName,
		selectedLanguageIndex,
		setSelectedLanguageIndex,
		languageTemplates,
		setSelectedAppIndex,
	} = context;

	const openDocs = useCallback(
		(from: string): void => {
			if (!selectedApp) return;
			setPreviousScreen(from as Screen);
			setDocsContent(readAppDocs(selectedApp));
			setDocsScrollOffset(0);
			setScreen("docs" as Screen);
		},
		[
			selectedApp,
			setPreviousScreen,
			setDocsContent,
			setDocsScrollOffset,
			setScreen,
		],
	);

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

	const requestExitConfirmation = useCallback((): void => {
		// This will be handled by the provider's state
	}, []);

	const confirmExit = useCallback((): void => {
		for (const handle of runningHandlesRef.current.values()) {
			if (typeof handle.stop === "function") {
				handle.stop();
			}
		}
		for (const run of runViews) {
			if (!run.isRunning || !run.pid || run.pid <= 0) {
				continue;
			}
			if (runningHandlesRef.current.has(run.id)) {
				continue;
			}
			stopProcessTree(run.pid);
		}
		try {
			process.exit(0);
		} catch {
			// If exit is not available in some environments, ignore.
		}
	}, [runViews, runningHandlesRef]);

	const createNewApp = useCallback((): void => {
		const template: LanguageTemplate | undefined =
			languageTemplates[selectedLanguageIndex];
		if (!template) {
			setStatusMessage("Selecione uma linguagem valida.");
			return;
		}

		try {
			const repoRoot = getRepoRoot();
			const createdAppName = createApp({
				repoRoot,
				appName: createAppName,
				template,
			});
			const refreshedApps = getApps(repoRoot);
			setApps(refreshedApps);
			const nextIndex = refreshedApps.findIndex(
				(app) => app.name === createdAppName,
			);
			setSelectedAppIndex(
				nextIndex >= 0 ? nextIndex : Math.max(apps.length - 1, 0),
			);
			setCreateAppName("");
			setSelectedLanguageIndex(0);
			setScreen("apps");
			setStatusMessage(
				`App "${createdAppName}" criado com sucesso em apps/${createdAppName}.`,
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Falha ao criar o app.";
			setStatusMessage(message);
		}
	}, [
		languageTemplates,
		selectedLanguageIndex,
		createAppName,
		setApps,
		setSelectedAppIndex,
		apps.length,
		setCreateAppName,
		setSelectedLanguageIndex,
		setScreen,
		setStatusMessage,
	]);

	return {
		openDocs,
		startExternalTerminal,
		stopSelectedRun,
		stopAllRunningRuns,
		clearFinishedRuns,
		requestExitConfirmation,
		confirmExit,
		createNewApp,
	};
}
