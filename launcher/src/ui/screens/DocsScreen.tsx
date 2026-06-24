import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { Layout } from "../components/Layout.js";

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
    <Layout
      title={`Documentacao: ${appName}`}
      activeMenus={{
        "Setas/j/k": true,
        "PgUp/PgDn": true,
        n: true,
        "Esc/d/b": true,
      }}
      footer={
        <Text dimColor>
          Linhas {Math.min(docsScrollOffset + 1, docsLinesCount)}-
          {Math.min(docsScrollOffset + docsViewportHeight, docsLinesCount)} de{" "}
          {docsLinesCount}
        </Text>
      }
    >
      <Box marginTop={0} flexDirection="column">
        {visibleDocsNodes}
      </Box>
    </Layout>
  );
}
