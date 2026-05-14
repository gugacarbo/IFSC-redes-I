export interface LanguageTemplate {
	id: string;
	label: string;
	description: string;
	createPackageJson: (appName: string) => Record<string, unknown>;
	createGitignore: () => string;
	createReadmeExtra?: () => string;
}

export interface CreateAppInput {
	repoRoot: string;
	appName: string;
	template: LanguageTemplate;
}
