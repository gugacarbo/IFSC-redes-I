import { Box, Spacer, Text } from "ink";
import type { RunViewState } from "../context/LauncherContext.js";
import { Header } from "../components/Header.js";
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
		<Box flexDirection="column" padding={1} width="100%" height="100%">
			<Header title="Terminais Externos" />
			<Spacer />
			<Text dimColor>
				Executando: {runningCount} | Finalizados: {finishedCount} | Total:{" "}
				{runViews.length}
			</Text>
			<Text dimColor>
				(Setas: selecionar | k: fecha selecionado | x: fecha todos | c: limpa
				| n: novo app | Esc/b: voltar)
			</Text>
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
		</Box>
	);
}
