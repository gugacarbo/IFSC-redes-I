import { createContext, useContext } from "react";
import type { LauncherContextValue } from "./types.js";

export const LauncherContext = createContext<LauncherContextValue | null>(null);

export function useLauncherContext(): LauncherContextValue {
	const context = useContext(LauncherContext);
	if (!context) {
		throw new Error(
			"useLauncherContext must be used within a LauncherProvider",
		);
	}
	return context;
}
