import { useStdout } from "ink";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { getScriptOptions } from "../../data/apps.js";
import { LANGUAGE_TEMPLATES } from "../../services/appCreator/languages.js";
import type { LanguageTemplate } from "../../services/appCreator/types.js";
import type { BackgroundRunHandle } from "../../services/runner.js";
import type { AppInfo, ScriptOption } from "../../types.js";
import { renderMarkdownLine } from "../markdown/renderMarkdownLine.js";
import { useLauncherActions } from "./useLauncherActions.js";

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
	apps: AppInfo[];
	setApps: React.Dispatch<React.SetStateAction<AppInfo[]>>;
	runningHandlesRef: React.MutableRefObject<Map<string, BackgroundRunHandle>>;
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

const LauncherContext = createContext<LauncherContextValue | null>(null);

interface LauncherProviderProps {
	apps: AppInfo[];
	children: React.ReactNode;
}

export function LauncherProvider({ apps, children }: LauncherProviderProps) {
	const [appsState, setApps] = useState<AppInfo[]>(apps);
	const [screen, setScreen] = useState<Screen>("apps");
	const [previousScreen, setPreviousScreen] = useState<Screen>("apps");
	const [runReturnScreen, setRunReturnScreen] = useState<Screen>("scripts");
	const [selectedAppIndex, setSelectedAppIndex] = useState<number>(0);
	const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0);
	const [statusMessage, setStatusMessage] = useState<string>("");
	const [docsContent, setDocsContent] = useState<string>("");
	const [docsScrollOffset, setDocsScrollOffset] = useState<number>(0);
	const [runViews, setRunViews] = useState<RunViewState[]>([]);
	const [selectedRunIndex, setSelectedRunIndex] = useState<number>(0);
	const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);
	const [createAppName, setCreateAppName] = useState<string>("");
	const [selectedLanguageIndex, setSelectedLanguageIndex] = useState<number>(0);
	const runningHandlesRef = useRef<Map<string, BackgroundRunHandle>>(new Map());
	const languageTemplates = LANGUAGE_TEMPLATES;

	const selectedApp = appsState[selectedAppIndex];
	const scriptOptions = getScriptOptions(selectedApp);

	const { stdout } = useStdout();
	const docsLines = docsContent.split("\n");
	const docsViewportHeight = Math.max((stdout?.rows ?? 24) - 12, 5);
	const maxDocsOffset = Math.max(docsLines.length - docsViewportHeight, 0);

	const runningCount = runViews.filter((run) => run.isRunning).length;
	const finishedCount = runViews.length - runningCount;

	const visibleDocsNodes = useMemo(() => {
		const visibleLines = docsLines.slice(
			docsScrollOffset,
			docsScrollOffset + docsViewportHeight,
		);
		let inCodeBlock = false;
		return visibleLines.map((line, index) => {
			const node = renderMarkdownLine(
				line,
				docsScrollOffset + index,
				inCodeBlock,
			);
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
			}
			return node;
		});
	}, [docsLines, docsScrollOffset, docsViewportHeight]);

	const actions = useLauncherActions({
		apps: appsState,
		setApps,
		selectedApp,
		setPreviousScreen,
		setDocsContent,
		setDocsScrollOffset,
		setScreen,
		setRunReturnScreen,
		setRunViews,
		setSelectedRunIndex,
		setStatusMessage,
		runningHandlesRef,
		runViews,
		selectedRunIndex,
		createAppName,
		setCreateAppName,
		selectedLanguageIndex,
		setSelectedLanguageIndex,
		languageTemplates,
		setSelectedAppIndex,
	});

	const requestExitConfirmation = useCallback(() => {
		setIsExitConfirmOpen(true);
	}, []);

	const value = useMemo(
		() => ({
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
			requestExitConfirmation,
		}),
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
			requestExitConfirmation,
		],
	);

	return (
		<LauncherContext.Provider value={value}>
			{children}
		</LauncherContext.Provider>
	);
}

export function useLauncherContext(): LauncherContextValue {
	const context = useContext(LauncherContext);
	if (!context) {
		throw new Error(
			"useLauncherContext must be used within a LauncherProvider",
		);
	}
	return context;
}
