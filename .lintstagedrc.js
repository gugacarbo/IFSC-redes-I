export default {
	"*.{ts,tsx,js,jsx,json}": "biome check --write",
	"*.md": "prettier --write",
	"apps/**/src/**/*.java": [
		(files) => `node ./tools/java/checkstyle-runner.cjs ${files.join(" ")}`,
	],
};
