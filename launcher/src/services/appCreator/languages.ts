import type { LanguageTemplate } from "./types.js";

export const LANGUAGE_TEMPLATES: LanguageTemplate[] = [
	{
		id: "java",
		label: "Java",
		description: "Projeto javac com src/ e dist/",
		createPackageJson: (appName) => ({
			name: appName,
			version: "1.0.0",
			private: true,
			description: `Aplicacao ${appName}`,
			scripts: {
				build: "mkdir -p dist && javac -d dist src/*.java",
				start: "npm run build && java -cp dist Main",
				dev: "npm run start",
				test: 'echo "Sem testes configurados"',
				lint: 'echo "Sem lint configurado"',
				typecheck: 'echo "Sem typecheck configurado"',
			},
		}),
		createGitignore: () => "dist/\n*.class\n",
		createReadmeExtra: () =>
			"## Desenvolvimento\n\n1. Coloque seus arquivos Java em `src/`\n2. Garanta uma classe `Main`\n3. Execute `npm run start`\n",
	},
	{
		id: "typescript",
		label: "TypeScript (Node)",
		description: "Projeto Node + TypeScript",
		createPackageJson: (appName) => ({
			name: appName,
			version: "1.0.0",
			private: true,
			type: "module",
			description: `Aplicacao ${appName}`,
			scripts: {
				build: "tsc",
				start: "node dist/index.js",
				dev: "tsx src/index.ts",
				test: 'echo "Sem testes configurados"',
				lint: 'echo "Sem lint configurado"',
				typecheck: "tsc --noEmit",
			},
		}),
		createGitignore: () => "node_modules/\ndist/\n.env\n",
	},
	{
		id: "python",
		label: "Python",
		description: "Projeto Python simples",
		createPackageJson: (appName) => ({
			name: appName,
			version: "1.0.0",
			private: true,
			description: `Aplicacao ${appName}`,
			scripts: {
				build: 'echo "Build nao necessario para Python"',
				start: "python src/main.py",
				dev: "python src/main.py",
				test: 'echo "Sem testes configurados"',
				lint: 'echo "Sem lint configurado"',
				typecheck: 'echo "Sem typecheck configurado"',
			},
		}),
		createGitignore: () => "__pycache__/\n*.pyc\n.venv/\n",
	},
];
