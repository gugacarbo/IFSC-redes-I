import { spawn } from "node:child_process";

export function stopProcessTree(pid: number): void {
	const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
		stdio: "ignore",
		shell: false,
	});
	killer.unref();
}
