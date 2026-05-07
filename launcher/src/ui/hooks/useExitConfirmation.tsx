import { useState } from "react";
import type { BackgroundRunHandle } from "../../services/runner.js";

export function useExitConfirmation(
	runningHandlesRef: React.MutableRefObject<Map<string, BackgroundRunHandle>>,
) {
	const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

	function requestExitConfirmation(): void {
		setIsExitConfirmOpen(true);
	}

	function confirmExit(): void {
		for (const handle of runningHandlesRef.current.values()) {
			// assume a stop() method exists on handles
			if (typeof handle.stop === "function") {
				handle.stop();
			}
		}
		// Exit the process to terminate the launcher
		try {
			process.exit(0);
		} catch {
			// If exit is not available in some environments, ignore.
		}
	}

	return {
		isExitConfirmOpen,
		setIsExitConfirmOpen,
		requestExitConfirmation,
		confirmExit,
	};
}
