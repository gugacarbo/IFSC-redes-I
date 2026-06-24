import { useInput } from "ink";
import type { LauncherContextValue, Screen } from "../context/types.js";
import { wrap } from "../utils/clamp.js";

export function useScriptsNavigation(
	context: Pick<
		LauncherContextValue,
		| "screen"
		| "setScreen"
		| "openDocs"
		| "selectedScriptIndex"
		| "setSelectedScriptIndex"
		| "scriptOptions"
		| "apps"
		| "selectedAppIndex"
		| "startExternalTerminal"
		| "isExitConfirmOpen"
	>,
) {
	const {
		screen,
		setScreen,
		openDocs,
		selectedScriptIndex,
		setSelectedScriptIndex,
		scriptOptions,
		apps,
		selectedAppIndex,
		startExternalTerminal,
		isExitConfirmOpen,
	} = context;

	useInput(
		(input, key) => {
			if (isExitConfirmOpen) return;
			if (key.ctrl && input === "c") {
				return;
			}

			if (input === "n") {
				setScreen("create" as Screen);
				return;
			}
			if (input === "t") {
				setScreen("run" as Screen);
				return;
			}
			if (input === "d") {
				openDocs("scripts");
				return;
			}
			if (key.escape) {
				setScreen("apps" as Screen);
				return;
			}
			if (key.upArrow) {
				setSelectedScriptIndex((prev) =>
					wrap(prev - 1, 0, scriptOptions.length - 1),
				);
				return;
			}
			if (key.downArrow) {
				setSelectedScriptIndex((prev) =>
					wrap(prev + 1, 0, scriptOptions.length - 1),
				);
				return;
			}
			if (key.return && apps[selectedAppIndex]) {
				const option = scriptOptions[selectedScriptIndex];
				if (option) {
					startExternalTerminal(apps[selectedAppIndex], option);
				}
			}
		},
		{ isActive: screen === "scripts" },
	);
}
