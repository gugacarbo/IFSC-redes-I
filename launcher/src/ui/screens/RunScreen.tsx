import { Box, Text } from "ink";
import type { RunViewState } from "../context/types.js";
import { Layout } from "../components/Layout.js";
import { List } from "../components/List.js";

interface RunScreenProps {
	runViews: RunViewState[];
	selectedIndex: number;
	runningCount: number;
	finishedCount: number;
}

export function RunScreen({
	runViews,
	selectedIndex,
	runningCount,
	finishedCount,
}: RunScreenProps) {
	return (
		<Layout
			title="Terminais Externos"
			activeMenus={{
				Setas: true,
				k: true,
				x: true,
				c: true,
				n: true,
				"Esc/b": true,
			}}
			footer={
				<Text dimColor>
					Executando: {runningCount} | Finalizados: {finishedCount} | Total:{" "}
					{runViews.length}
				</Text>
			}
		>
			{runViews.length === 0 ? (
				<Text dimColor>Nenhum terminal iniciado ainda.</Text>
			) : (
				<Box marginTop={1} flexDirection="column">
					<List
						items={runViews.map((run, index) => ({
							label: `[${run.isRunning ? "RUN" : "END"}] ${run.appName} -> ${run.scriptLabel} | PID: ${run.pid ?? "..."} | ${run.status}`,
							isSelected: index === selectedIndex,
						}))}
						getItemKey={(item) => item.label}
					/>
				</Box>
			)}
		</Layout>
	);
}
