import { Box, Spacer, Text } from "ink";
import type { ReactNode } from "react";
import { Header } from "../components/Header.js";

interface DocsScreenProps {
  appName: string;
  visibleDocsNodes: ReactNode[];
  docsScrollOffset: number;
  docsViewportHeight: number;
  docsLinesCount: number;
}

export function DocsScreen({
  appName,
  visibleDocsNodes,
  docsScrollOffset,
  docsViewportHeight,
  docsLinesCount,
}: DocsScreenProps) {
  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Header title={`Documentacao: ${appName}`} />
      <Spacer />
      <Text dimColor>
        Use setas, j/k ou PgUp/PgDn para rolar. n: novo app. Esc, d ou b para voltar.
      </Text>
      <Text color="green">[b] Voltar</Text>
      <Box marginTop={1} flexDirection="column">
        {visibleDocsNodes}
      </Box>
      <Text dimColor>
        Linhas {Math.min(docsScrollOffset + 1, docsLinesCount)}-
        {Math.min(docsScrollOffset + docsViewportHeight, docsLinesCount)} de {docsLinesCount}
      </Text>
    </Box>
  );
}
