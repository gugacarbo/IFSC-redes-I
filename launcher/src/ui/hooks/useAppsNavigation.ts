import { useInput } from "ink";
import type { LauncherContextValue, Screen } from "../context/types.js";
import { wrap } from "../utils/clamp.js";

export function useAppsNavigation(
	context: Pick<
		LauncherContextValue,
		| "screen"
		| "setScreen"
		| "setSelectedAppIndex"
		| "apps"
		| "selectedAppIndex"
		| "openDocs"
		| "requestExitConfirmation"
		| "setSelectedScriptIndex"
		| "isExitConfirmOpen"
	>,
) {
	const {
		screen,
		setScreen,
		setSelectedAppIndex,
		apps,
		selectedAppIndex,
		openDocs,
		requestExitConfirmation,
		setSelectedScriptIndex,
		isExitConfirmOpen,
	} = context;

	useInput(
		(input, key) => {
			if (isExitConfirmOpen) return;
			if (key.ctrl && input === "c") {
				requestExitConfirmation();
				return;
			}

			if (key.escape) {
				requestExitConfirmation();
				return;
			}
			if (input === "t") {
				setScreen("run" as Screen);
				return;
			}
			if (input === "n") {
				setScreen("create" as Screen);
				return;
			}
			if (input === "d") {
				openDocs("apps");
				return;
			}
			if (input === "q") {
				requestExitConfirmation();
				return;
			}
			if (key.upArrow) {
				setSelectedAppIndex((prev) => wrap(prev - 1, 0, apps.length - 1));
				return;
			}
			if (key.downArrow) {
				setSelectedAppIndex((prev) => wrap(prev + 1, 0, apps.length - 1));
				return;
			}
			if (key.return && apps[selectedAppIndex]) {
				setSelectedScriptIndex(0);
				setScreen("scripts" as Screen);
			}
		},
		{ isActive: screen === "apps" },
	);
}
