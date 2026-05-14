import { useState } from "react";
import { Layout } from "./components/layout";
import { Dashboard } from "./components/dashboard";
import { ConfigView } from "./components/config";
import { Console } from "./components/console";
import { useIoT } from "./hooks/useIoT";
import { Alert, AlertDescription } from "@udp-iot/ui/components/alert";

function App() {
	const [tab, setTab] = useState("dashboard");
	const { filiais, config, connected, logs, sendCommand, clearLogs } = useIoT();

	return (
		<Layout currentTab={tab} setTab={setTab} connected={connected}>
			{!connected && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>Desconectado da Matriz. Tentando reconectar...</AlertDescription>
				</Alert>
			)}

			{tab === "dashboard" && (
				<Dashboard filiais={filiais} config={config} onCommand={sendCommand} />
			)}
			{tab === "config" && (
				<ConfigView />
			)}
			{tab === "console" && (
				<Console logs={logs} onClear={clearLogs} />
			)}
		</Layout>
	);
}

export default App;
