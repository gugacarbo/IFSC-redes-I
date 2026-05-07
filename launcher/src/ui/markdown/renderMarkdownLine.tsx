import { Text } from "ink";
import type { ReactNode } from "react";
import { renderInlineMarkdown as renderInlineMarkdownUtil } from "./renderInlineMarkdown.js";

export function renderMarkdownLine(
	line: string,
	lineIndex: number,
	inCodeBlock: boolean,
): ReactNode {
	if (line.trim().startsWith("```")) {
		return (
			<Text key={`line-${lineIndex}`} color="yellow">
				{inCodeBlock ? "└─ fim de bloco de codigo" : "┌─ bloco de codigo"}
			</Text>
		);
	}

	if (inCodeBlock) {
		return (
			<Text key={`line-${lineIndex}`} color="yellow">
				{line}
			</Text>
		);
	}

	const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
	if (headingMatch) {
		const level = headingMatch[1].length;
		const title = headingMatch[2];
		const headingColor =
			level === 1
				? "cyan"
				: level === 2
					? "green"
					: level === 3
						? "magenta"
						: "white";
		return (
			<Text key={`line-${lineIndex}`} color={headingColor} bold>
				{`${"#".repeat(level)} ${title}`}
			</Text>
		);
	}

	if (/^\s*[-*]\s+/.test(line)) {
		const content = line.replace(/^\s*[-*]\s+/, "");
		return (
			<Text key={`line-${lineIndex}`}>
				<Text color="green">• </Text>
				{renderInlineMarkdownUtil(content)}
			</Text>
		);
	}

	if (/^\s*\d+\.\s+/.test(line)) {
		const content = line.replace(/^\s*(\d+\.)\s+/, "$1 ");
		return (
			<Text key={`line-${lineIndex}`}>{renderInlineMarkdownUtil(content)}</Text>
		);
	}

	if (/^\s*>/.test(line)) {
		const content = line.replace(/^\s*>\s?/, "");
		return (
			<Text key={`line-${lineIndex}`} color="gray">
				│ {renderInlineMarkdownUtil(content)}
			</Text>
		);
	}

	return (
		<Text key={`line-${lineIndex}`}>{renderInlineMarkdownUtil(line)}</Text>
	);
}
