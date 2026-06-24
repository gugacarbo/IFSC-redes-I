import { useInput } from "ink";
import type { LauncherContextValue, Screen } from "../context/types.js";
import { wrap } from "../utils/clamp.js";

export function useCreateNavigation(
	context: Pick<
		LauncherContextValue,
		| "screen"
		| "setCreateAppName"
		| "setSelectedLanguageIndex"
		| "setScreen"
		| "languageTemplates"
		| "createNewApp"
		| "isExitConfirmOpen"
	>,
) {
	const {
		screen,
		setCreateAppName,
		setSelectedLanguageIndex,
		setScreen,
		languageTemplates,
		createNewApp,
		isExitConfirmOpen,
	} = context;

	useInput(
		(input, key) => {
			if (isExitConfirmOpen) return;
			if (key.ctrl && input === "c") {
				return;
			}

			if (key.escape) {
				setCreateAppName("");
				setSelectedLanguageIndex(0);
				setScreen("apps" as Screen);
				return;
			}
			if (key.upArrow) {
				setSelectedLanguageIndex((prev) =>
					wrap(prev - 1, 0, languageTemplates.length - 1),
				);
				return;
			}
			if (key.downArrow) {
				setSelectedLanguageIndex((prev) =>
					wrap(prev + 1, 0, languageTemplates.length - 1),
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
		},
		{ isActive: screen === "create" },
	);
}
