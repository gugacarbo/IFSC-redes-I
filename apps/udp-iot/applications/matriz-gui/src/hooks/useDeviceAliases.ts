import { useCallback, useMemo, useState } from "react";
import { makeAliasKey } from "../lib/deviceNaming";

const STORAGE_KEY = "matriz-gui:device-aliases";

type AliasMap = Record<string, string>;

function loadAliases(): AliasMap {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw);
		return typeof parsed === "object" && parsed ? parsed : {};
	} catch {
		return {};
	}
}

export function useDeviceAliases() {
	const [aliases, setAliases] = useState<AliasMap>(() => loadAliases());

	const persist = useCallback((next: AliasMap) => {
		setAliases(next);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		}
	}, []);

	const getAlias = useCallback(
		(ip: string, deviceId: string) => aliases[makeAliasKey(ip, deviceId)],
		[aliases],
	);

	const setAlias = useCallback(
		(ip: string, deviceId: string, alias: string) => {
			const key = makeAliasKey(ip, deviceId);
			const trimmed = alias.trim();
			const next = { ...aliases };

			if (trimmed) {
				next[key] = trimmed;
			} else {
				delete next[key];
			}

			persist(next);
		},
		[aliases, persist],
	);

	const clearAlias = useCallback(
		(ip: string, deviceId: string) => {
			const key = makeAliasKey(ip, deviceId);
			if (!(key in aliases)) return;

			const next = { ...aliases };
			delete next[key];
			persist(next);
		},
		[aliases, persist],
	);

	return useMemo(
		() => ({ getAlias, setAlias, clearAlias, aliases }),
		[getAlias, setAlias, clearAlias, aliases],
	);
}
