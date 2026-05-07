const cp = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const jarName = `checkstyle.jar`;
const jarPath = path.resolve(__dirname, jarName);
const cfgPath = path.resolve(__dirname, "checkstyle.xml");

function globToRegExp(globPattern) {
	const escaped = globPattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, ".*")
		.replace(/\?/g, ".");
	return new RegExp(`^${escaped}$`);
}

function expandArg(arg) {
	if (!arg.includes("*") && !arg.includes("?")) {
		return [arg];
	}

	const normalized = arg.replaceAll("\\", "/");
	const slashIndex = normalized.lastIndexOf("/");
	const dirPart = slashIndex === -1 ? "." : normalized.slice(0, slashIndex);
	const basePart = slashIndex === -1 ? normalized : normalized.slice(slashIndex + 1);
	const dirPath = path.resolve(process.cwd(), dirPart);

	if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
		return [];
	}

	const matcher = globToRegExp(basePart);
	return fs
		.readdirSync(dirPath)
		.filter((name) => matcher.test(name))
		.map((name) => path.join(dirPart, name).replaceAll("\\", "/"));
}

const files = process.argv.slice(2).flatMap(expandArg);
if (files.length === 0) {
	console.error("Usage: node checkstyle-runner.js <file1> <file2> ...");
	process.exit(1);
}

const cmd = `java -jar "${jarPath}" -c "${cfgPath}" ${files.map((f) => `"${f}"`).join(" ")}`;

console.log(`Running ${cmd}`);

try {
	cp.execSync(cmd, { stdio: "inherit" });
} catch (e) {
	process.exit(e.status || 1);
}
