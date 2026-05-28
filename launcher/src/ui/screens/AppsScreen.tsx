// launcher/src/ui/screens/AppsScreen.tsx
import { Box, Spacer, Text } from "ink";
import type { AppInfo } from "../../types.js";
import { Header } from "../components/Header.js";
import { Footer } from "../components/Footer.js";
import { List } from "../components/List.js";

interface AppsScreenProps {
  apps: AppInfo[];
  selectedIndex: number;
}

export function AppsScreen({ apps, selectedIndex }: AppsScreenProps) {
  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Header title="IFSC Estrutura de Dados - Launcher" />
      <Spacer />
      <Text dimColor>
        Selecione um app (Enter), n para novo app, d para docs, t para terminais, q/Esc/Ctrl+C para sair.
      </Text>
      <Box marginTop={1} flexDirection="column">
        <List
          items={apps.map((app) => ({ label: app.name }))}
          getItemKey={(app) => app.label}
        />
      </Box>
      <Spacer />
      <Text dimColor>{apps[selectedIndex]?.description ?? "Sem descricao"}</Text>
      <Footer instructions="Cada script abre em uma nova janela de terminal com monitoramento." />
    </Box>
  );
}
