import { useState } from "react";
import { useFilial } from "./hooks/useFilial";
import { Layout } from "./components/layout";
import { Dashboard } from "./components/dashboard";
import { DeviceEditor } from "./components/device-editor";
import { Config } from "./components/config";
import { Console } from "./components/console";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { devices, connected, config, logs, clearLogs, setDevice, addDevice, removeDevice, updateDevice, updateConfig } = useFilial();

  return (
    <Layout connected={connected} activeTab={activeTab} onTabChange={setActiveTab}>
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
      {activeTab === "console" && (
        <Console logs={logs} onClear={clearLogs} />
      )}
    </Layout>
  );
}

export default App;
