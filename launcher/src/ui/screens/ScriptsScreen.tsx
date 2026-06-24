import type { ScriptOption } from "../../types.js";
import { Layout } from "../components/Layout.js";
import { List } from "../components/List.js";

interface ScriptsScreenProps {
	appName: string;
	scriptOptions: ScriptOption[];
	selectedIndex: number;
}

export function ScriptsScreen({ appName, scriptOptions, selectedIndex }: ScriptsScreenProps) {
	return (
		<Layout
			title={appName}
			activeMenus={{ Enter: true, d: true, n: true, t: true, Esc: true }}
		>
			<List
				items={scriptOptions.map((opt, index) => ({
					label: opt.label,
					isSelected: index === selectedIndex,
				}))}
				getItemKey={(opt) => opt.label}
			/>
		</Layout>
	);
}
