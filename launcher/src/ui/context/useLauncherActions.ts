import { useCallback } from "react";
import { stopProcessTree } from "../../services/process/stopProcessTree.js";
import { readAppDocs } from "../docs/readAppDocs.js";
import type { LauncherContextValue, Screen } from "./types.js";

export function useLauncherActions(
	context: Pick<
		LauncherContextValue,
		| "selectedApp"
		| "setPreviousScreen"
		| "setDocsContent"
		| "setDocsScrollOffset"
		| "setScreen"
		| "runningHandlesRef"
		| "runViews"
	>,
) {
	const {
		selectedApp,
		setPreviousScreen,
		setDocsContent,
		setDocsScrollOffset,
		setScreen,
		runningHandlesRef,
		runViews,
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

	return {
		openDocs,
		requestExitConfirmation,
		confirmExit,
	};
}
