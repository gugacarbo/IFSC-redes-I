const cp = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const DEFAULT_URL = "https://github.com/checkstyle/checkstyle/releases/download/checkstyle-10.18.0/checkstyle-10.18.0-all.jar";

function downloadFile(url, destPath) {
	const destDir = path.dirname(destPath);
	if (!fs.existsSync(destDir)) {
		fs.mkdirSync(destDir, { recursive: true });
	}

	console.log(`Downloading ${url} to ${destPath}...`);
	try {
		cp.execSync(`curl -sL -o "${destPath}" "${url}"`, { stdio: "inherit" });
		console.log("Download completed successfully.");
	} catch (e) {
		console.error(`Failed to download from ${url}`);
		process.exit(1);
	}
}

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
	const basePart =
		slashIndex === -1 ? normalized : normalized.slice(slashIndex + 1);
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

// Parse CLI args: --url <url> [files...]
const args = process.argv.slice(2);
let url = DEFAULT_URL;
let fileIndex = 0;

if (args[0] === "--url" && args[1]) {
	url = args[1];
	fileIndex = 2;
} else if (args[0]?.startsWith("--url=")) {
	url = args[0].slice(6);
	fileIndex = 1;
}

// Extract output filename from URL
const urlParts = url.split("/");
const outputFile = urlParts[urlParts.length - 1];
const outputPath = path.resolve(__dirname, outputFile);

// Download if not exists
if (!fs.existsSync(outputPath)) {
	downloadFile(url, outputPath);
}

const files = args.slice(fileIndex).flatMap(expandArg);
if (files.length === 0) {
	console.log("No files to check. JAR downloaded successfully.");
	process.exit(0);
}

const jarPath = outputPath;
const cfgPath = path.resolve(__dirname, "checkstyle.xml");

if (!fs.existsSync(cfgPath)) {
	console.error(`Config file not found: ${cfgPath}`);
	process.exit(1);
}

const cmd = `java -jar "${jarPath}" -c "${cfgPath}" ${files.map((f) => `"${f}"`).join(" ")}`;

console.log(`Running ${cmd}`);

try {
	cp.execSync(cmd, { stdio: "inherit" });
} catch (e) {
	process.exit(e.status || 1);
}
