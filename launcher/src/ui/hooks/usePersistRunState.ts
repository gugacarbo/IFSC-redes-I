import { useEffect } from "react";
import { savePersistedRunState } from "../../services/state/runStateStore.js";
import type { RunViewState } from "../context/types.js";

export function usePersistRunState(repoRoot: string, runViews: RunViewState[]) {
	useEffect(() => {
		savePersistedRunState(repoRoot, runViews);
	}, [repoRoot, runViews]);
}
