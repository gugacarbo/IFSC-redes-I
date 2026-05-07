export default {
	"*.{ts,tsx,js,jsx,json}": "biome check --write",
	"*.md": "prettier --write",
	"apps/**/src/**/*.java": [
		(files) => `npm run format:java ${files.join(" ")}`,
	],
};
