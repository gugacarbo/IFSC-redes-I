import { Box, Spacer, Text } from "ink";
import type { AppInfo } from "../types.js";
import {
	LauncherProvider,
	type RunViewState,
	useLauncherContext,
} from "./context/LauncherContext.js";
import { useNavigation } from "./hooks/useNavigation.js";

interface LauncherAppProps {
	apps: AppInfo[];
	repoRoot: string;
	initialRunViews: RunViewState[];
	initialStatusMessage: string;
}

function LauncherAppContent() {
	const {
		screen,
		selectedAppIndex,
		selectedScriptIndex,
		docsContent,
		docsScrollOffset,
		runViews,
		selectedRunIndex,
		isExitConfirmOpen,
		createAppName,
		selectedLanguageIndex,
		selectedApp,
		scriptOptions,
		languageTemplates,
		visibleDocsNodes,
		docsViewportHeight,
		runningCount,
		finishedCount,
		statusMessage,
		apps,
	} = useLauncherContext();

	useNavigation();

	if (apps.length === 0) {
		return <Text>Nenhum app encontrado em apps/.</Text>;
	}

	const docsLines = docsContent.split("\n");

	return (
		<Box flexDirection="column" padding={1} width="100%" height="100%">
			<Text bold color="cyan">
				IFSC Estrutura de Dados - Launcher
			</Text>
			<Spacer />
			{screen === "apps" ? (
				<>
					<Text dimColor>
						Selecione um app (Enter), n para novo app, d para docs, t para
						terminais, q/Esc/Ctrl+C para sair.
					</Text>
					<Box marginTop={1} flexDirection="column">
						{apps.map((app, index) => (
							<Text
								key={app.name}
								color={index === selectedAppIndex ? "green" : undefined}
							>
								{index === selectedAppIndex ? "> " : "  "}
								{app.name}
							</Text>
						))}
					</Box>
					<Spacer />
					<Text dimColor>{selectedApp?.description ?? "Sem descricao"}</Text>
				</>
			) : screen === "scripts" ? (
				<>
					<Text dimColor>
						{selectedApp?.name}: selecione um script (Enter), d para docs, Esc
						para voltar, t para terminais, n para novo app.
					</Text>
					<Box marginTop={1} flexDirection="column">
						{scriptOptions.map((option, index) => (
							<Text
								key={option.id}
								color={index === selectedScriptIndex ? "green" : undefined}
							>
								{index === selectedScriptIndex ? "> " : "  "}
								{option.label}
							</Text>
						))}
					</Box>
				</>
			) : screen === "run" ? (
				<>
					<Text dimColor>
						Terminais externos (Setas: selecionar | k: fecha selecionado | x:
						fecha todos | c: limpa | n: novo app | Esc/b: voltar)
					</Text>
					<Text dimColor>
						Executando: {runningCount} | Finalizados: {finishedCount} | Total:{" "}
						{runViews.length}
					</Text>
					{runViews.length === 0 ? (
						<Text dimColor>Nenhum terminal iniciado ainda.</Text>
					) : (
						<Box marginTop={1} flexDirection="column">
							{runViews.map((run, index) => (
								<Text
									key={run.id}
									color={index === selectedRunIndex ? "green" : undefined}
								>
									{index === selectedRunIndex ? "> " : "  "}[
									{run.isRunning ? "RUN" : "END"}] {run.appName} {"->"}{" "}
									{run.scriptLabel} | PID: {run.pid ?? "..."} | {run.status}
								</Text>
							))}
						</Box>
					)}
				</>
			) : screen === "create" ? (
				<>
					<Text dimColor>
						Criar app: digite o nome, use setas para linguagem e Enter para
						criar. Esc cancela.
					</Text>
					<Text color="green">Nome: {createAppName || "_"}</Text>
					<Text dimColor>Linguagem:</Text>
					<Box marginTop={1} flexDirection="column">
						{languageTemplates.map((template, index) => (
							<Text
								key={template.id}
								color={index === selectedLanguageIndex ? "green" : undefined}
							>
								{index === selectedLanguageIndex ? "> " : "  "}
								{template.label} - {template.description}
							</Text>
						))}
					</Box>
				</>
			) : (
				<>
					<Text dimColor>Documentacao: {selectedApp?.name}</Text>
					<Text dimColor>
						Use setas, j/k ou PgUp/PgDn para rolar. n: novo app. Esc, d ou b
						para voltar.
					</Text>
					<Text color="green">[b] Voltar</Text>
					<Box marginTop={1} flexDirection="column">
						{visibleDocsNodes}
					</Box>
					<Text dimColor>
						Linhas {Math.min(docsScrollOffset + 1, docsLines.length)}-
						{Math.min(docsScrollOffset + docsViewportHeight, docsLines.length)}{" "}
						de {docsLines.length}
					</Text>
				</>
			)}
			<Spacer />
			<Text dimColor>
				Cada script abre em uma nova janela de terminal com monitoramento.
			</Text>
			{isExitConfirmOpen ? (
				<Text color="yellow">
					Confirma sair do launcher? Enter/y confirma | n/Esc cancela.
				</Text>
			) : null}
			{statusMessage ? <Text color="cyan">{statusMessage}</Text> : null}
		</Box>
	);
}

export function LauncherApp({
	apps,
	repoRoot,
	initialRunViews,
	initialStatusMessage,
}: LauncherAppProps) {
	return (
		<LauncherProvider
			apps={apps}
			repoRoot={repoRoot}
			initialRunViews={initialRunViews}
			initialStatusMessage={initialStatusMessage}
		>
			<LauncherAppContent />
		</LauncherProvider>
	);
}
