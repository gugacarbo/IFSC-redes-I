import type { BackgroundRunHandle } from "../../services/runner.js";
import type { LanguageTemplate } from "../../services/appCreator/types.js";
import type { AppInfo, ScriptOption } from "../../types.js";

export type Screen = "apps" | "scripts" | "docs" | "run" | "create";

export interface RunViewState {
	id: string;
	appName: string;
	scriptLabel: string;
	pid: number | null;
	isRunning: boolean;
	status: string;
}

export interface LauncherContextValue {
	screen: Screen;
	setScreen: React.Dispatch<React.SetStateAction<Screen>>;
	previousScreen: Screen;
	setPreviousScreen: React.Dispatch<React.SetStateAction<Screen>>;
	runReturnScreen: Screen;
	setRunReturnScreen: React.Dispatch<React.SetStateAction<Screen>>;
	selectedAppIndex: number;
	setSelectedAppIndex: React.Dispatch<React.SetStateAction<number>>;
	selectedScriptIndex: number;
	setSelectedScriptIndex: React.Dispatch<React.SetStateAction<number>>;
	statusMessage: string;
	setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
	docsContent: string;
	setDocsContent: React.Dispatch<React.SetStateAction<string>>;
	docsScrollOffset: number;
	setDocsScrollOffset: React.Dispatch<React.SetStateAction<number>>;
	runViews: RunViewState[];
	setRunViews: React.Dispatch<React.SetStateAction<RunViewState[]>>;
	selectedRunIndex: number;
	setSelectedRunIndex: React.Dispatch<React.SetStateAction<number>>;
	isExitConfirmOpen: boolean;
	setIsExitConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
	repoDisplayName: string;
	apps: AppInfo[];
	setApps: React.Dispatch<React.SetStateAction<AppInfo[]>>;
	runningHandlesRef: React.MutableRefObject<
		Map<string, BackgroundRunHandle>
	>;
	createAppName: string;
	setCreateAppName: React.Dispatch<React.SetStateAction<string>>;
	selectedLanguageIndex: number;
	setSelectedLanguageIndex: React.Dispatch<React.SetStateAction<number>>;
	languageTemplates: LanguageTemplate[];

	selectedApp: AppInfo | undefined;
	scriptOptions: ScriptOption[];
	docsLines: string[];
	visibleDocsNodes: React.ReactNode[];
	docsViewportHeight: number;
	maxDocsOffset: number;
	runningCount: number;
	finishedCount: number;

	openDocs: (from: string) => void;
	startExternalTerminal: (app: AppInfo, option: ScriptOption) => void;
	stopSelectedRun: () => void;
	stopAllRunningRuns: () => void;
	clearFinishedRuns: () => void;
	requestExitConfirmation: () => void;
	confirmExit: () => void;
	createNewApp: () => void;
}
