const { mkdirSync, readdirSync, rmSync, statSync, existsSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const action = process.argv[2];

function findJavaFiles(dir) {
	if (!existsSync(dir)) return [];
	const entries = readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...findJavaFiles(fullPath));
		} else if (entry.name.endsWith(".java")) {
			files.push(fullPath);
		}
	}
	return files;
}

const srcFiles = findJavaFiles(path.join("src"));
const testFiles = findJavaFiles(path.join("test"));
const loggingSrcDir = path.join("..", "..", "packages", "logging", "java", "src");
const sourcepath = ["src", loggingSrcDir].join(path.delimiter);
const classpath = ["dist", loggingSrcDir].join(path.delimiter);

function run(command, args) {
	const result = spawnSync(command, args, { stdio: "inherit" });
	if (result.error) throw result.error;
	process.exit(result.status ?? 1);
}

if (action === "clean") {
	if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
	process.exit(0);
}

if (action === "build" || action === "typecheck" || action === "lint") {
	mkdirSync("dist", { recursive: true });
	const args = [
		...(action === "build" ? [] : ["-Xlint:all"]),
		"-d",
		"dist",
		"-sourcepath",
		sourcepath,
		...srcFiles,
	];
	run("javac", args);
}

if (action === "dev") {
	run("java", ["-cp", classpath, "Main"]);
}

if (action === "test") {
	mkdirSync("dist/test", { recursive: true });
	const allSourcepath = [sourcepath, "test"].join(path.delimiter);
	run("javac", [
		"-d", "dist/test",
		"-sourcepath", allSourcepath,
		...srcFiles,
		...testFiles,
	]);
	run("java", ["-cp", "dist/test;dist;" + loggingSrcDir, "JsonHelperTest"]);
}

if (action === "format") {
	const runner = path.join("..", "..", "tools", "java", "checkstyle-runner.cjs");
	run("node", [runner, ...srcFiles, ...testFiles]);
}

console.error(`Unknown action: ${action ?? "<empty>"}`);
process.exit(1);
