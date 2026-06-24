// launcher/src/ui/screens/AppsScreen.tsx
import { Text } from "ink";
import type { AppInfo } from "../../types.js";
import { Layout } from "../components/Layout.js";
import { List } from "../components/List.js";
import { useLauncherContext } from "../context/LauncherContext.js";

interface AppsScreenProps {
  apps: AppInfo[];
  selectedIndex: number;
}

export function AppsScreen({ apps, selectedIndex }: AppsScreenProps) {
  const { repoDisplayName } = useLauncherContext();
  return (
    <Layout
      title={repoDisplayName}
      activeMenus={{ Enter: true, n: true, d: true, t: true, "q/Esc": true }}
      footer={
        <Text dimColor>
          {apps[selectedIndex]?.description ?? "Sem descricao"}
        </Text>
      }
    >
      <List
        items={apps.map((app, index) => ({
          label: app.name,
          isSelected: index === selectedIndex,
        }))}
        getItemKey={(app) => app.label}
      />
    </Layout>
  );
}
