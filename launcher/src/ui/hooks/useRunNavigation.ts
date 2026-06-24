import { useInput } from "ink";
import type { LauncherContextValue, Screen } from "../context/types.js";
import { clamp } from "../utils/clamp.js";

export function useRunNavigation(
	context: Pick<
		LauncherContextValue,
		| "screen"
		| "setScreen"
		| "runReturnScreen"
		| "setSelectedRunIndex"
		| "runViews"
		| "stopSelectedRun"
		| "stopAllRunningRuns"
		| "clearFinishedRuns"
		| "isExitConfirmOpen"
	>,
) {
	const {
		screen,
		setScreen,
		runReturnScreen,
		setSelectedRunIndex,
		runViews,
		stopSelectedRun,
		stopAllRunningRuns,
		clearFinishedRuns,
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
			if (key.upArrow) {
				setSelectedRunIndex((prev) => clamp(prev - 1, 0, runViews.length - 1));
				return;
			}
			if (key.downArrow) {
				setSelectedRunIndex((prev) => clamp(prev + 1, 0, runViews.length - 1));
				return;
			}
			if (input === "k") {
				stopSelectedRun();
				return;
			}
			if (input === "x") {
				stopAllRunningRuns();
				return;
			}
			if (input === "c") {
				clearFinishedRuns();
				return;
			}
			if (key.escape || input === "b") {
				setScreen(runReturnScreen);
			}
		},
		{ isActive: screen === "run" },
	);
}
