import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CreateAppInput } from "./types.js";

function toSlug(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export function normalizeAppName(input: string): string {
	return toSlug(input);
}

export function createApp({
	repoRoot,
	appName,
	template,
}: CreateAppInput): string {
	const normalizedName = normalizeAppName(appName);
	if (!normalizedName) {
		throw new Error("Nome do app invalido.");
	}

	const appDir = join(repoRoot, "apps", normalizedName);
	if (existsSync(appDir)) {
		throw new Error(`Ja existe um app com o nome "${normalizedName}".`);
	}

	mkdirSync(appDir, { recursive: true });

	const packageJsonPath = join(appDir, "package.json");
	const gitignorePath = join(appDir, ".gitignore");
	const readmePath = join(appDir, "README.md");

	const packageJson = template.createPackageJson(normalizedName);
	const readmeExtra = template.createReadmeExtra
		? template.createReadmeExtra()
		: "";
	const readme = `# ${normalizedName}

Projeto criado pelo launcher.

- Linguagem: ${template.label}
- Download (DownGit): https://downgit.github.io/#/https://github.com/gugacarbo/IFSC-redes-I/tree/main/apps/${normalizedName}

${readmeExtra}`.trimEnd();

	writeFileSync(
		packageJsonPath,
		`${JSON.stringify(packageJson, null, "\t")}\n`,
		"utf-8",
	);
	writeFileSync(gitignorePath, template.createGitignore(), "utf-8");
	writeFileSync(readmePath, `${readme}\n`, "utf-8");

	return normalizedName;
}
