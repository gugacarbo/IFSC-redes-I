import { Text } from "ink";
import type { AppInfo } from "../types.js";
import {
	LauncherProvider,
	type RunViewState,
	useLauncherContext,
} from "./context/index.js";
import { useNavigation } from "./hooks/index.js";
import { AppsScreen } from "./screens/AppsScreen.js";
import { CreateScreen } from "./screens/CreateScreen.js";
import { DocsScreen } from "./screens/DocsScreen.js";
import { RunScreen } from "./screens/RunScreen.js";
import { ScriptsScreen } from "./screens/ScriptsScreen.js";

interface LauncherAppProps {
	apps: AppInfo[];
	repoRoot: string;
	initialRunViews: RunViewState[];
	initialStatusMessage: string;
}

function LauncherAppContent() {
	const {
		screen,
		apps,
		selectedAppIndex,
		selectedScriptIndex,
		selectedApp,
		scriptOptions,
		runViews,
		selectedRunIndex,
		runningCount,
		finishedCount,
		visibleDocsNodes,
		docsScrollOffset,
		docsViewportHeight,
		docsContent,
		createAppName,
		languageTemplates,
		selectedLanguageIndex,
		isExitConfirmOpen,
		statusMessage,
	} = useLauncherContext();

	useNavigation();

	if (apps.length === 0) {
		return <Text>Nenhum app encontrado em apps/.</Text>;
	}

	return (
		<>
			{screen === "apps" && (
				<AppsScreen apps={apps} selectedIndex={selectedAppIndex} />
			)}
			{screen === "scripts" && selectedApp && (
				<ScriptsScreen
					appName={selectedApp.name}
					scriptOptions={scriptOptions}
					selectedIndex={selectedScriptIndex}
				/>
			)}
			{screen === "run" && (
				<RunScreen
					runViews={runViews}
					selectedIndex={selectedRunIndex}
					runningCount={runningCount}
					finishedCount={finishedCount}
				/>
			)}
			{screen === "docs" && selectedApp && (
				<DocsScreen
					appName={selectedApp.name}
					visibleDocsNodes={visibleDocsNodes}
					docsScrollOffset={docsScrollOffset}
					docsViewportHeight={docsViewportHeight}
					docsLinesCount={docsContent.split("\n").length}
				/>
			)}
			{screen === "create" && (
				<CreateScreen
					appName={createAppName}
					languageTemplates={languageTemplates}
					selectedLanguageIndex={selectedLanguageIndex}
				/>
			)}
			{isExitConfirmOpen && (
				<Text color="yellow">
					Confirma sair do launcher? Enter/y confirma | n/Esc cancela.
				</Text>
			)}
			{statusMessage && <Text color="cyan">{statusMessage}</Text>}
		</>
	);
}

export function LauncherApp({
	apps,
	repoRoot,
	initialRunViews,
	initialStatusMessage,
}: LauncherAppProps) {
	return (
		<LauncherProvider
			apps={apps}
			repoRoot={repoRoot}
			initialRunViews={initialRunViews}
			initialStatusMessage={initialStatusMessage}
		>
			<LauncherAppContent />
		</LauncherProvider>
	);
}
