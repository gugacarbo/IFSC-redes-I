import { Box, Spacer, Text } from "ink";
import type { ScriptOption } from "../../types.js";
import { Header } from "../components/Header.js";
import { List } from "../components/List.js";

interface ScriptsScreenProps {
	appName: string;
	scriptOptions: ScriptOption[];
	selectedIndex: number;
}

export function ScriptsScreen({ appName, scriptOptions, selectedIndex }: ScriptsScreenProps) {
	return (
		<Box flexDirection="column" padding={1} width="100%" height="100%">
			<Header title={appName} subtitle="selecione um script" />
			<Spacer />
			<Text dimColor>
				{appName}: selecione um script (Enter), d para docs, Esc para voltar, t para terminais, n para novo app.
			</Text>
			<Box marginTop={1} flexDirection="column">
				<List
					items={scriptOptions.map((opt) => ({ label: opt.label }))}
					getItemKey={(opt) => opt.label}
				/>
			</Box>
		</Box>
	);
}
