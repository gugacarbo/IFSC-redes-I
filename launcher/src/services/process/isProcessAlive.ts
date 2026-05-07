export function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		if (error instanceof Error && "code" in error) {
			const code = (error as NodeJS.ErrnoException).code;
			return code === "EPERM";
		}
		return false;
	}
}
