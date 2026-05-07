export type Screen = "apps" | "scripts" | "docs" | "run";

export interface RunViewState {
	id: string;
	appName: string;
	scriptLabel: string;
	pid: number | null;
	isRunning: boolean;
	status: string;
}
