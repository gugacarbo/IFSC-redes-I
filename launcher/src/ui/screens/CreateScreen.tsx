import { Box, Spacer, Text } from "ink";
import type { LanguageTemplate } from "../../services/appCreator/types.js";
import { Header } from "../components/Header.js";
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
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Header title="Criar App" />
      <Spacer />
      <Text dimColor>
        Criar app: digite o nome, use setas para linguagem e Enter para criar. Esc cancela.
      </Text>
      <Text color="green">Nome: {appName || "_"}</Text>
      <Text dimColor>Linguagem:</Text>
      <Box marginTop={1} flexDirection="column">
        <List
          items={languageTemplates.map((t) => ({ label: `${t.label} - ${t.description}` }))}
          getItemKey={(t) => t.label}
        />
      </Box>
    </Box>
  );
}
