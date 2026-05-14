const { mkdirSync, readdirSync, rmSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const action = process.argv[2];
const srcDir = path.join("src", "matriz");
const javaFiles = readdirSync(srcDir)
	.filter((file) => file.endsWith(".java"))
	.map((file) => path.join(srcDir, file));

const sharedSrcDir = path.join("..", "..", "packages", "udp-shared", "src");
const loggingSrcDir = path.join("..", "..", "..", "..", "packages", "logging", "java", "src");
const sourceClasspath = ["src", sharedSrcDir, loggingSrcDir].join(path.delimiter);
const runtimeClasspath = ["dist", sharedSrcDir, loggingSrcDir].join(path.delimiter);

function run(command, args) {
	const result = spawnSync(command, args, { stdio: "inherit" });
	if (result.error) {
		throw result.error;
	}
	process.exit(result.status ?? 1);
}

if (action === "clean") {
	rmSync("dist", { recursive: true, force: true });
	process.exit(0);
}

if (action === "build" || action === "typecheck" || action === "lint") {
	mkdirSync("dist", { recursive: true });
	const args = [
		...(action === "build" ? [] : ["-Xlint"]),
		"-d",
		"dist",
		"-cp",
		sourceClasspath,
		...javaFiles,
	];
	run("javac", args);
}

if (action === "dev") {
	run("java", ["-cp", runtimeClasspath, "matriz.MatrizMain"]);
}

console.error(`Acao invalida: ${action ?? "<vazia>"}`);
process.exit(1);
