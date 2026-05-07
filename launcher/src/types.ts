export interface AppInfo {
	name: string;
	description: string;
	path: string;
	scripts: string[];
}

export interface ScriptOption {
	id: string;
	label: string;
	type: "script" | "start";
}

export interface RunningProcess {
	id: string;
	appName: string;
	scriptName: string;
	pid: number;
}
