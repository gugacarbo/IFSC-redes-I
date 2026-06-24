import { useCallback, useMemo, useRef, useState } from "react";
import { getMonorepoDisplayName, getScriptOptions } from "../../data/apps.js";
import { LANGUAGE_TEMPLATES } from "../../services/appCreator/languages.js";
import type { LanguageTemplate } from "../../services/appCreator/types.js";
import type { BackgroundRunHandle } from "../../services/runner.js";
import type { AppInfo } from "../../types.js";
import {
	useDocsRenderer,
	useVisibleDocsNodes,
} from "../hooks/useDocsRenderer.js";
import { usePersistRunState } from "../hooks/usePersistRunState.js";
import { useRestoreInitialRuns } from "../hooks/useRestoreInitialRuns.js";
import { LauncherContext } from "./LauncherContext.js";
import type { LauncherContextValue, RunViewState, Screen } from "./types.js";
import { useAppCreation } from "./useAppCreation.js";
import { useLauncherActions } from "./useLauncherActions.js";
import { useRunActions } from "./useRunActions.js";

interface LauncherProviderProps {
	apps: AppInfo[];
	repoRoot: string;
	initialRunViews: PersistedRunView[];
	initialStatusMessage: string;
	children: React.ReactNode;
}

interface PersistedRunView {
	id: string;
	appName: string;
	scriptLabel: string;
	pid: number | null;
	isRunning: boolean;
	status: string;
}

export function LauncherProvider({
	apps,
	repoRoot,
	initialRunViews,
	initialStatusMessage,
	children,
}: LauncherProviderProps) {
	const [appsState, setApps] = useState<AppInfo[]>(apps);
	const [screen, setScreen] = useState<Screen>("apps");
	const [previousScreen, setPreviousScreen] = useState<Screen>("apps");
	const [runReturnScreen, setRunReturnScreen] = useState<Screen>("scripts");
	const [selectedAppIndex, setSelectedAppIndex] = useState<number>(0);
	const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0);
	const [statusMessage, setStatusMessage] =
		useState<string>(initialStatusMessage);
	const [docsContent, setDocsContent] = useState<string>("");
	const [docsScrollOffset, setDocsScrollOffset] = useState<number>(0);
	const [runViews, setRunViews] = useState<RunViewState[]>(initialRunViews);
	const [selectedRunIndex, setSelectedRunIndex] = useState<number>(0);
	const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);
	const [createAppName, setCreateAppName] = useState<string>("");
	const [selectedLanguageIndex, setSelectedLanguageIndex] = useState<number>(0);
	const runningHandlesRef = useRef<Map<string, BackgroundRunHandle>>(new Map());
	const languageTemplates: LanguageTemplate[] = LANGUAGE_TEMPLATES;
	const repoDisplayName = getMonorepoDisplayName(repoRoot);

	const selectedApp = appsState[selectedAppIndex];
	const scriptOptions = getScriptOptions(selectedApp);

	const { docsLines, docsViewportHeight, maxDocsOffset } =
		useDocsRenderer(docsContent);
	const { visibleDocsNodes } = useVisibleDocsNodes(
		docsLines,
		docsScrollOffset,
		docsViewportHeight,
	);

	const runningCount = runViews.filter((run) => run.isRunning).length;
	const finishedCount = runViews.length - runningCount;

	useRestoreInitialRuns(initialRunViews, runningHandlesRef, setRunViews);
	usePersistRunState(repoRoot, runViews);

	const actions = useLauncherActions({
		selectedApp,
		setPreviousScreen,
		setDocsContent,
		setDocsScrollOffset,
		setScreen,
		runningHandlesRef,
		runViews,
	});

	const runActions = useRunActions({
		setScreen,
		setRunReturnScreen,
		setRunViews,
		setSelectedRunIndex,
		setStatusMessage,
		runningHandlesRef,
		runViews,
		selectedRunIndex,
	});

	const appCreation = useAppCreation({
		languageTemplates,
		selectedLanguageIndex,
		createAppName,
		setApps,
		setSelectedAppIndex,
		apps: appsState,
		setCreateAppName,
		setSelectedLanguageIndex,
		setScreen,
		setStatusMessage,
	});

	const requestExitConfirmation = useCallback(() => {
		setIsExitConfirmOpen(true);
	}, []);

	const value = useMemo(
		() =>
			({
				screen,
				setScreen,
				previousScreen,
				setPreviousScreen,
				runReturnScreen,
				setRunReturnScreen,
				selectedAppIndex,
				setSelectedAppIndex,
				selectedScriptIndex,
				setSelectedScriptIndex,
				statusMessage,
				setStatusMessage,
				docsContent,
				setDocsContent,
				docsScrollOffset,
				setDocsScrollOffset,
				runViews,
				setRunViews,
				selectedRunIndex,
				setSelectedRunIndex,
				isExitConfirmOpen,
				setIsExitConfirmOpen,
				repoDisplayName,
				apps: appsState,
				setApps,
				runningHandlesRef,
				createAppName,
				setCreateAppName,
				selectedLanguageIndex,
				setSelectedLanguageIndex,
				languageTemplates,
				selectedApp,
				scriptOptions,
				docsLines,
				visibleDocsNodes,
				docsViewportHeight,
				maxDocsOffset,
				runningCount,
				finishedCount,
				...actions,
				...runActions,
				...appCreation,
				requestExitConfirmation,
			}) as LauncherContextValue,
		[
			screen,
			previousScreen,
			runReturnScreen,
			selectedAppIndex,
			selectedScriptIndex,
			statusMessage,
			docsContent,
			docsScrollOffset,
			runViews,
			selectedRunIndex,
			isExitConfirmOpen,
			repoDisplayName,
			appsState,
			createAppName,
			selectedLanguageIndex,
			selectedApp,
			scriptOptions,
			docsLines,
			visibleDocsNodes,
			docsViewportHeight,
			maxDocsOffset,
			runningCount,
			finishedCount,
			actions,
			runActions,
			appCreation,
			requestExitConfirmation,
		],
	);

	return (
		<LauncherContext.Provider value={value}>
			{children}
		</LauncherContext.Provider>
	);
}
