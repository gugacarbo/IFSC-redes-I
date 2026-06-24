import { Route, Routes } from "react-router-dom";
import { Config } from "./components/config";
import { Console } from "@udp-iot/ui/components/console";
import { Dashboard } from "./components/dashboard";
import { DeviceEditor } from "./components/device-editor";
import { Layout } from "./components/layout";
import { useFilial } from "./hooks/useFilial";

function App() {
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
		<Routes>
			<Route element={<Layout connected={connected} />}>
				<Route
					index
					element={<Dashboard devices={devices} onSetDevice={setDevice} />}
				/>
				<Route
					path="devices"
					element={
						<DeviceEditor
							devices={devices}
							onAdd={addDevice}
							onRemove={removeDevice}
							onRename={updateDevice}
						/>
					}
				/>
				<Route
					path="config"
					element={<Config config={config} onSave={updateConfig} />}
				/>
				<Route
					path="console"
					element={<Console logs={logs} onClear={clearLogs} />}
				/>
			</Route>
		</Routes>
	);
}

export default App;
