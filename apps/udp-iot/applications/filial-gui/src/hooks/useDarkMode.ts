import { useCallback, useEffect, useState } from "react";

function getInitialDark(): boolean {
	if (typeof window === "undefined") return false;
	const stored = localStorage.getItem("theme");
	if (stored === "dark") return true;
	if (stored === "light") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDark(isDark: boolean) {
	document.documentElement.classList.toggle("dark", isDark);
}

export function useDarkMode() {
	const [isDark, setIsDark] = useState(getInitialDark);

	useEffect(() => {
		applyDark(isDark);
	}, [isDark]);

	const toggle = useCallback(() => {
		setIsDark((prev) => {
			const next = !prev;
			localStorage.setItem("theme", next ? "dark" : "light");
			return next;
		});
	}, []);

	return { isDark, toggle } as const;
}
