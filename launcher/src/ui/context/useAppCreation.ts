import { useCallback } from "react";
import { getApps, getRepoRoot } from "../../data/apps.js";
import { createApp } from "../../services/appCreator/createApp.js";
import type { LauncherContextValue } from "./types.js";

export function useAppCreation(
	context: Pick<
		LauncherContextValue,
		| "languageTemplates"
		| "selectedLanguageIndex"
		| "createAppName"
		| "setApps"
		| "setSelectedAppIndex"
		| "apps"
		| "setCreateAppName"
		| "setSelectedLanguageIndex"
		| "setScreen"
		| "setStatusMessage"
	>,
) {
	const {
		languageTemplates,
		selectedLanguageIndex,
		createAppName,
		setApps,
		setSelectedAppIndex,
		apps,
		setCreateAppName,
		setSelectedLanguageIndex,
		setScreen,
		setStatusMessage,
	} = context;

	const createNewApp = useCallback((): void => {
		const template = languageTemplates[selectedLanguageIndex];
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

	return { createNewApp };
}
