import { spawn } from "node:child_process";

export function stopProcessTree(pid: number): void {
	if (process.platform === "win32") {
		const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
			stdio: "ignore",
			shell: false,
		});
		killer.unref();
		return;
	}

	// Linux: kill process group (negative PID), then single process
	try {
		process.kill(-pid, "SIGTERM");
	} catch {
		try {
			process.kill(pid, "SIGTERM");
		} catch {
			// process already dead
		}
	}
}
