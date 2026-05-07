export function useDocsNavigation(
	docsScrollOffset: number,
	setDocsScrollOffset: (n: number) => void,
	maxDocsOffset: number,
	docsViewportHeight: number,
) {
	// Simple navigation helper for docs scrolling
	const navigateDocs = (action: "up" | "down" | "pageUp" | "pageDown") => {
		switch (action) {
			case "up":
				setDocsScrollOffset(Math.max(docsScrollOffset - 1, 0));
				break;
			case "down":
				setDocsScrollOffset(Math.min(docsScrollOffset + 1, maxDocsOffset));
				break;
			case "pageUp":
				setDocsScrollOffset(Math.max(docsScrollOffset - docsViewportHeight, 0));
				break;
			case "pageDown":
				setDocsScrollOffset(
					Math.min(docsScrollOffset + docsViewportHeight, maxDocsOffset),
				);
				break;
		}
	};

	return { navigateDocs };
}
