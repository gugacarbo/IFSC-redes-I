import { Text } from "ink";
import type { ReactNode } from "react";

export function renderInlineMarkdown(text: string): ReactNode[] {
	const tokens: ReactNode[] = [];
	let cursor = 0;
	const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

	for (const match of text.matchAll(pattern)) {
		const token = match[0];
		const index = match.index ?? 0;
		if (index > cursor) {
			tokens.push(text.slice(cursor, index));
		}

		if (token.startsWith("`") && token.endsWith("`")) {
			tokens.push(
				<Text key={`${index}-code`} color="black" backgroundColor="gray">
					{token.slice(1, -1)}
				</Text>,
			);
		} else if (token.startsWith("**") && token.endsWith("**")) {
			tokens.push(
				<Text key={`${index}-bold`} bold>
					{token.slice(2, -2)}
				</Text>,
			);
		} else if (token.startsWith("*") && token.endsWith("*")) {
			tokens.push(
				<Text key={`${index}-italic`} dimColor>
					{token.slice(1, -1)}
				</Text>,
			);
		} else {
			const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
			if (linkMatch) {
				tokens.push(
					<Text key={`${index}-link`} color="blue" underline>
						{linkMatch[1]} ({linkMatch[2]})
					</Text>,
				);
			} else {
				tokens.push(token);
			}
		}

		cursor = index + token.length;
	}

	if (cursor < text.length) {
		tokens.push(text.slice(cursor));
	}

	return tokens.length > 0 ? tokens : [text];
}
