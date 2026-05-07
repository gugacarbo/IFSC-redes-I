import { useInput } from "ink";
import { useLauncherContext } from "../context/LauncherContext.js";
import { clamp } from "../utils/clamp.js";

export function useNavigation() {
	const {
		screen,
		setScreen,
		previousScreen,
		runReturnScreen,
		maxDocsOffset,
		docsViewportHeight,
		setDocsScrollOffset,
		selectedAppIndex,
		setSelectedAppIndex,
		apps,
		scriptOptions,
		selectedScriptIndex,
		setSelectedScriptIndex,
		runViews,
		setSelectedRunIndex,
		createAppName,
		setCreateAppName,
		selectedLanguageIndex,
		setSelectedLanguageIndex,
		languageTemplates,
		isExitConfirmOpen,
		requestExitConfirmation,
		openDocs,
		startExternalTerminal,
		stopSelectedRun,
		stopAllRunningRuns,
		clearFinishedRuns,
		createNewApp,
	} = useLauncherContext();

	const isRawModeSupported = true;

	useInput(
		(input, key) => {
			if (isExitConfirmOpen) {
				if (key.return || input === "y" || input === "s") {
					return;
				}
				if (key.escape || input === "n") {
					return;
				}
				return;
			}

			if ((screen === "apps" && input === "q") || (key.ctrl && input === "c")) {
				requestExitConfirmation();
				return;
			}

			if (screen === "docs") {
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
				return;
			}

			if (screen === "run") {
				if (input === "n") {
					setScreen("create");
					return;
				}
				if (key.upArrow) {
					setSelectedRunIndex((prev) =>
						clamp(prev - 1, 0, runViews.length - 1),
					);
					return;
				}
				if (key.downArrow) {
					setSelectedRunIndex((prev) =>
						clamp(prev + 1, 0, runViews.length - 1),
					);
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
				return;
			}

			if (screen === "create") {
				if (key.escape) {
					setCreateAppName("");
					setSelectedLanguageIndex(0);
					setScreen("apps");
					return;
				}
				if (key.upArrow) {
					setSelectedLanguageIndex((prev) =>
						clamp(prev - 1, 0, languageTemplates.length - 1),
					);
					return;
				}
				if (key.downArrow) {
					setSelectedLanguageIndex((prev) =>
						clamp(prev + 1, 0, languageTemplates.length - 1),
					);
					return;
				}
				if (key.backspace || key.delete) {
					setCreateAppName((prev) => prev.slice(0, -1));
					return;
				}
				if (key.return) {
					createNewApp();
					return;
				}
				if (!key.ctrl && !key.meta && input.length === 1) {
					const isAllowed = /[a-zA-Z0-9-_ ]/.test(input);
					if (isAllowed) {
						setCreateAppName((prev) => `${prev}${input}`);
					}
				}
				return;
			}

			if (screen === "apps") {
				if (key.escape) {
					requestExitConfirmation();
					return;
				}
				if (input === "t") {
					setScreen("run");
					return;
				}
				if (input === "n") {
					setCreateAppName(createAppName);
					setSelectedLanguageIndex(selectedLanguageIndex);
					setScreen("create");
					return;
				}
				if (input === "d") {
					openDocs("apps");
					return;
				}
				if (key.upArrow) {
					setSelectedAppIndex((prev) => clamp(prev - 1, 0, apps.length - 1));
					return;
				}
				if (key.downArrow) {
					setSelectedAppIndex((prev) => clamp(prev + 1, 0, apps.length - 1));
					return;
				}
				if (key.return && apps[selectedAppIndex]) {
					setSelectedScriptIndex(0);
					setScreen("scripts");
				}
				return;
			}

			if (screen === "scripts") {
				if (input === "n") {
					setScreen("create");
					return;
				}
				if (input === "t") {
					setScreen("run");
					return;
				}
				if (input === "d") {
					openDocs("scripts");
					return;
				}
				if (key.escape) {
					setScreen("apps");
					return;
				}
				if (key.upArrow) {
					setSelectedScriptIndex((prev) =>
						clamp(prev - 1, 0, scriptOptions.length - 1),
					);
					return;
				}
				if (key.downArrow) {
					setSelectedScriptIndex((prev) =>
						clamp(prev + 1, 0, scriptOptions.length - 1),
					);
					return;
				}
				if (key.return && apps[selectedAppIndex]) {
					const option = scriptOptions[selectedScriptIndex];
					if (option) {
						startExternalTerminal(apps[selectedAppIndex], option);
					}
				}
			}
		},
		{ isActive: isRawModeSupported },
	);
}
