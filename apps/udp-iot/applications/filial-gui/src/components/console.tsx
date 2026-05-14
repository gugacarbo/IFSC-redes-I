import { Button } from "@udp-iot/ui/components/button";
import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";

interface ConsoleProps {
	logs: LogEntry[];
	onClear: () => void;
}

export function Console({ logs, onClear }: ConsoleProps) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const autoScroll = useRef(true);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
		autoScroll.current = isAtBottom;
	}, []);

	useEffect(() => {
		if (autoScroll.current) {
			bottomRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Console</h2>
				<Button variant="outline" size="sm" onClick={onClear}>
					Limpar
				</Button>
			</div>
			<div
				ref={containerRef}
				className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-[60vh] overflow-y-auto whitespace-pre-wrap break-all"
			>
				{logs.length === 0 && (
					<span className="text-zinc-500">Aguardando logs...</span>
				)}
				{logs.map((entry, i) => (
					<div
						key={i}
						className={
							entry.level === "error" ? "text-red-400" : "text-green-400"
						}
					>
						<span className="text-zinc-500 mr-2">
							[{new Date(entry.ts).toLocaleTimeString()}]
						</span>
						{entry.message}
					</div>
				))}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
