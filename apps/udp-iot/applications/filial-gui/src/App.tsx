import { useState } from "react";
import { Config } from "./components/config";
import { Console } from "./components/console";
import { Dashboard } from "./components/dashboard";
import { DeviceEditor } from "./components/device-editor";
import { Layout } from "./components/layout";
import { useFilial } from "./hooks/useFilial";

function App() {
	const [activeTab, setActiveTab] = useState("dashboard");
	const {
		devices,
		connected,
		config,
		logs,
		clearLogs,
		setDevice,
		addDevice,
		removeDevice,
		updateDevice,
		updateConfig,
	} = useFilial();

	return (
		<Layout
			connected={connected}
			activeTab={activeTab}
			onTabChange={setActiveTab}
		>
			{activeTab === "dashboard" && (
				<Dashboard devices={devices} onSetDevice={setDevice} />
			)}
			{activeTab === "devices" && (
				<DeviceEditor
					devices={devices}
					onAdd={addDevice}
					onRemove={removeDevice}
					onRename={updateDevice}
				/>
			)}
			{activeTab === "config" && (
				<Config config={config} onSave={updateConfig} />
			)}
			{activeTab === "console" && <Console logs={logs} onClear={clearLogs} />}
		</Layout>
	);
}

export default App;
