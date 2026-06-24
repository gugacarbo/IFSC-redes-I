import { useLauncherContext } from "../context/LauncherContext.js";
import { useAppsNavigation } from "./useAppsNavigation.js";
import { useCreateNavigation } from "./useCreateNavigation.js";
import { useDocsNavigation } from "./useDocsNavigation.js";
import { useRunNavigation } from "./useRunNavigation.js";
import { useScriptsNavigation } from "./useScriptsNavigation.js";

export function useNavigation() {
	const context = useLauncherContext();
	useAppsNavigation(context);
	useScriptsNavigation(context);
	useRunNavigation(context);
	useDocsNavigation(context);
	useCreateNavigation(context);
}
