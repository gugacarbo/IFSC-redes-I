import type { AppInfo, ScriptOption } from "../../types.js";
import { shouldBuild } from "../buildUtils/shouldBuild.js";

export function buildCommandForOption(
	app: AppInfo,
	option: ScriptOption,
): string {
	if (option.type === "script") {
		return `npm run "${option.id}"`;
	}

	if (shouldBuild(app)) {
		return 'npm run "build" && npm run "dev"';
	}

	return 'npm run "dev"';
}
