import { Box, Text } from "ink";
import type { LanguageTemplate } from "../../services/appCreator/types.js";
import { Layout } from "../components/Layout.js";
import { List } from "../components/List.js";

interface CreateScreenProps {
  appName: string;
  languageTemplates: LanguageTemplate[];
  selectedLanguageIndex: number;
}

export function CreateScreen({
  appName,
  languageTemplates,
  selectedLanguageIndex,
}: CreateScreenProps) {
  return (
    <Layout
      title="Criar App"
      activeMenus={{ Setas: true, Enter: true, Esc: true }}
    >
      <Text color="green">Nome: {appName || "_"}</Text>
      <Text dimColor>Linguagem:</Text>
      <Box marginTop={1} flexDirection="column">
        <List
          items={languageTemplates.map((t, index) => ({
            label: `${t.label} - ${t.description}`,
            isSelected: index === selectedLanguageIndex,
          }))}
          getItemKey={(t) => t.label}
        />
      </Box>
    </Layout>
  );
}
