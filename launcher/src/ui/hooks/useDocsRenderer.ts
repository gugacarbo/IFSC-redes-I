import { useStdout } from "ink";
import { useMemo } from "react";
import { renderMarkdownLine } from "../markdown/renderMarkdownLine.js";

export function useDocsRenderer(docsContent: string) {
	const { stdout } = useStdout();
	const docsLines = docsContent.split("\n");
	const docsViewportHeight = Math.max((stdout?.rows ?? 24) - 12, 5);
	const maxDocsOffset = Math.max(docsLines.length - docsViewportHeight, 0);

	return { docsLines, docsViewportHeight, maxDocsOffset };
}

export function useVisibleDocsNodes(
	docsLines: string[],
	docsScrollOffset: number,
	docsViewportHeight: number,
) {
	const visibleDocsNodes = useMemo(() => {
		const visibleLines = docsLines.slice(
			docsScrollOffset,
			docsScrollOffset + docsViewportHeight,
		);
		let inCodeBlock = false;
		return visibleLines.map((line, index) => {
			const node = renderMarkdownLine(
				line,
				docsScrollOffset + index,
				inCodeBlock,
			);
			if (line.trim().startsWith("```")) inCodeBlock = !inCodeBlock;
			return node;
		});
	}, [docsLines, docsScrollOffset, docsViewportHeight]);

	return { visibleDocsNodes };
}
