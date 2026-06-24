import { useInput } from "ink";
import type { LauncherContextValue } from "../context/types.js";
import { clamp } from "../utils/clamp.js";

export function useDocsNavigation(
	context: Pick<
		LauncherContextValue,
		| "screen"
		| "isExitConfirmOpen"
		| "setIsExitConfirmOpen"
		| "confirmExit"
		| "setScreen"
		| "previousScreen"
		| "setDocsScrollOffset"
		| "maxDocsOffset"
		| "docsViewportHeight"
		| "requestExitConfirmation"
	>,
) {
	const {
		screen,
		isExitConfirmOpen,
		setIsExitConfirmOpen,
		confirmExit,
		setScreen,
		previousScreen,
		setDocsScrollOffset,
		maxDocsOffset,
		docsViewportHeight,
		requestExitConfirmation,
	} = context;

	useInput((input, key) => {
		if (!isExitConfirmOpen) return;
		if (key.return || input === "y" || input === "s") {
			confirmExit();
			return;
		}
		if (key.escape || input === "n") {
			setIsExitConfirmOpen(false);
			return;
		}
	});

	useInput(
		(input, key) => {
			if (isExitConfirmOpen) return;
			if (key.ctrl && input === "c") {
				requestExitConfirmation();
				return;
			}

			if (input === "n") {
				setScreen("create");
				return;
			}
			if (key.escape || input === "d" || input === "b") {
				setScreen(previousScreen);
				return;
			}
			if (key.upArrow || input === "k") {
				setDocsScrollOffset((prev) => clamp(prev - 1, 0, maxDocsOffset));
				return;
			}
			if (key.downArrow || input === "j") {
				setDocsScrollOffset((prev) => clamp(prev + 1, 0, maxDocsOffset));
				return;
			}
			if (key.pageUp) {
				setDocsScrollOffset((prev) =>
					clamp(prev - docsViewportHeight, 0, maxDocsOffset),
				);
				return;
			}
			if (key.pageDown || input === " ") {
				setDocsScrollOffset((prev) =>
					clamp(prev + docsViewportHeight, 0, maxDocsOffset),
				);
			}
		},
		{ isActive: screen === "docs" },
	);
}
