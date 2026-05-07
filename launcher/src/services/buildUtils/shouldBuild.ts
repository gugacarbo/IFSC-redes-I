import type { AppInfo } from "../../types.js";
import { getLatestMtime } from "../fileUtils/getLatestMtime.js";
import { listClassFiles } from "../fileUtils/listClassFiles.js";
import { listJavaFiles } from "../fileUtils/listJavaFiles.js";

export function shouldBuild(app: AppInfo): boolean {
	const javaFiles = listJavaFiles(app.path);
	if (javaFiles.length === 0) {
		return false;
	}

	const classFiles = listClassFiles(app.path);
	if (classFiles.length === 0) {
		return true;
	}

	const latestJava = getLatestMtime(javaFiles);
	const latestClass = getLatestMtime(classFiles);
	return latestClass < latestJava;
}
