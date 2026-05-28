# Launcher UI Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor launcher UI for better layout, spacing, alignment, and visual hierarchy with modular code organization.

**Architecture:** Split LauncherApp into screen components, create reusable UI components, centralize theme/styles.

**Tech Stack:** React, Ink, TypeScript

---

## File Structure

```
src/ui/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── List.tsx
│   └── Theme.ts
├── screens/
│   ├── AppsScreen.tsx
│   ├── ScriptsScreen.tsx
│   ├── RunScreen.tsx
│   ├── DocsScreen.tsx
│   └── CreateScreen.tsx
└── LauncherApp.tsx (refactored)
```

---

### Task 1: Create Theme.ts

**Files:**
- Create: `launcher/src/ui/components/Theme.ts`

- [ ] **Step 1: Create Theme.ts with spacing and color constants**

```typescript
// launcher/src/ui/components/Theme.ts
export const theme = {
  spacing: {
    small: 1,
    medium: 2,
    large: 3,
  },
  colors: {
    primary: "cyan",
    secondary: "green",
    dim: "dim",
    warning: "yellow",
  },
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/components/Theme.ts
git commit -m "feat: add theme constants for launcher UI"
```

---

### Task 2: Create Header.tsx component

**Files:**
- Create: `launcher/src/ui/components/Header.tsx`

- [ ] **Step 1: Create Header component**

```typescript
// launcher/src/ui/components/Header.tsx
import { Box, Text } from "ink";
import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">{title}</Text>
      {subtitle && <Text dimColor>{subtitle}</Text>}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/components/Header.tsx
git commit -m "feat: add Header component for launcher"
```

---

### Task 3: Create Footer.tsx component

**Files:**
- Create: `launcher/src/ui/components/Footer.tsx`

- [ ] **Step 1: Create Footer component**

```typescript
// launcher/src/ui/components/Footer.tsx
import { Box, Text } from "ink";

interface FooterProps {
  instructions: string;
}

export function Footer({ instructions }: FooterProps) {
  return (
    <Box marginTop={1} flexDirection="column">
      <Text dimColor>{instructions}</Text>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/components/Footer.tsx
git commit -m "feat: add Footer component for launcher"
```

---

### Task 4: Create List.tsx component

**Files:**
- Create: `launcher/src/ui/components/List.tsx`

- [ ] **Step 1: Create List component**

```typescript
// launcher/src/ui/components/List.tsx
import { Text } from "ink";

interface ListItem {
  label: string;
  isSelected?: boolean;
}

interface ListProps {
  items: ListItem[];
  getItemKey?: (item: ListItem, index: number) => string;
}

export function List({ items, getItemKey }: ListProps) {
  return (
    <>
      {items.map((item, index) => (
        <Text key={getItemKey?.(item, index) ?? index} color={item.isSelected ? "green" : undefined}>
          {item.isSelected ? "> " : "  "}{item.label}
        </Text>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/components/List.tsx
git commit -m "feat: add List component for launcher"
```

---

### Task 5: Create AppsScreen.tsx

**Files:**
- Create: `launcher/src/ui/screens/AppsScreen.tsx`

- [ ] **Step 1: Create AppsScreen component**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/screens/AppsScreen.tsx
git commit -m "feat: add AppsScreen component"
```

---

### Task 6: Create ScriptsScreen.tsx

**Files:**
- Create: `launcher/src/ui/screens/ScriptsScreen.tsx`

- [ ] **Step 1: Create ScriptsScreen component**

```typescript
// launcher/src/ui/screens/ScriptsScreen.tsx
import { Box, Spacer, Text } from "ink";
import type { ScriptOption } from "../../types.js";
import { Header } from "../components/Header.js";
import { List } from "../components/List.js";

interface ScriptsScreenProps {
  appName: string;
  scriptOptions: ScriptOption[];
  selectedIndex: number;
}

export function ScriptsScreen({ appName, scriptOptions, selectedIndex }: ScriptsScreenProps) {
  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Header title={appName} subtitle="selecione um script" />
      <Spacer />
      <Text dimColor>
        {appName}: selecione um script (Enter), d para docs, Esc para voltar, t para terminais, n para novo app.
      </Text>
      <Box marginTop={1} flexDirection="column">
        <List
          items={scriptOptions.map((opt) => ({ label: opt.label }))}
          getItemKey={(opt) => opt.label}
        />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/screens/ScriptsScreen.tsx
git commit -m "feat: add ScriptsScreen component"
```

---

### Task 7: Create RunScreen.tsx

**Files:**
- Create: `launcher/src/ui/screens/RunScreen.tsx`

- [ ] **Step 1: Create RunScreen component**

```typescript
// launcher/src/ui/screens/RunScreen.tsx
import { Box, Spacer, Text } from "ink";
import type { RunViewState } from "../context/LauncherContext.js";
import { Header } from "../components/Header.js";
import { List } from "../components/List.js";

interface RunScreenProps {
  runViews: RunViewState[];
  selectedIndex: number;
  runningCount: number;
  finishedCount: number;
}

export function RunScreen({ runViews, selectedIndex, runningCount, finishedCount }: RunScreenProps) {
  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Header title="Terminais Externos" />
      <Spacer />
      <Text dimColor>
        Executando: {runningCount} | Finalizados: {finishedCount} | Total: {runViews.length}
      </Text>
      <Text dimColor>
        (Setas: selecionar | k: fecha selecionado | x: fecha todos | c: limpa | n: novo app | Esc/b: voltar)
      </Text>
      {runViews.length === 0 ? (
        <Text dimColor>Nenhum terminal iniciado ainda.</Text>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <List
            items={runViews.map((run) => ({
              label: `[${run.isRunning ? "RUN" : "END"}] ${run.appName} -> ${run.scriptLabel} | PID: ${run.pid ?? "..."} | ${run.status}`,
            }))}
            getItemKey={(run) => run.label}
          />
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/screens/RunScreen.tsx
git commit -m "feat: add RunScreen component"
```

---

### Task 8: Create DocsScreen.tsx

**Files:**
- Create: `launcher/src/ui/screens/DocsScreen.tsx`

- [ ] **Step 1: Create DocsScreen component**

```typescript
// launcher/src/ui/screens/DocsScreen.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/screens/DocsScreen.tsx
git commit -m "feat: add DocsScreen component"
```

---

### Task 9: Create CreateScreen.tsx

**Files:**
- Create: `launcher/src/ui/screens/CreateScreen.tsx`

- [ ] **Step 1: Create CreateScreen component**

```typescript
// launcher/src/ui/screens/CreateScreen.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/screens/CreateScreen.tsx
git commit -m "feat: add CreateScreen component"
```

---

### Task 10: Refactor LauncherApp.tsx

**Files:**
- Modify: `launcher/src/ui/LauncherApp.tsx`

- [ ] **Step 1: Refactor LauncherApp to use screen components**

```typescript
// launcher/src/ui/LauncherApp.tsx
import { Box, Text } from "ink";
import { useLauncherContext } from "./context/LauncherContext.js";
import { useNavigation } from "./hooks/useNavigation.js";
import { AppsScreen } from "./screens/AppsScreen.js";
import { ScriptsScreen } from "./screens/ScriptsScreen.js";
import { RunScreen } from "./screens/RunScreen.js";
import { DocsScreen } from "./screens/DocsScreen.js";
import { CreateScreen } from "./screens/CreateScreen.js";

interface LauncherAppProps {
  apps: AppInfo[];
  repoRoot: string;
  initialRunViews: RunViewState[];
  initialStatusMessage: string;
}

function LauncherAppContent() {
  const {
    screen,
    apps,
    selectedAppIndex,
    selectedScriptIndex,
    selectedApp,
    scriptOptions,
    runViews,
    selectedRunIndex,
    runningCount,
    finishedCount,
    visibleDocsNodes,
    docsScrollOffset,
    docsViewportHeight,
    docsContent,
    createAppName,
    languageTemplates,
    selectedLanguageIndex,
    isExitConfirmOpen,
    statusMessage,
  } = useLauncherContext();

  useNavigation();

  if (apps.length === 0) {
    return <Text>Nenhum app encontrado em apps/.</Text>;
  }

  return (
    <>
      {screen === "apps" && (
        <AppsScreen apps={apps} selectedIndex={selectedAppIndex} />
      )}
      {screen === "scripts" && selectedApp && (
        <ScriptsScreen
          appName={selectedApp.name}
          scriptOptions={scriptOptions}
          selectedIndex={selectedScriptIndex}
        />
      )}
      {screen === "run" && (
        <RunScreen
          runViews={runViews}
          selectedIndex={selectedRunIndex}
          runningCount={runningCount}
          finishedCount={finishedCount}
        />
      )}
      {screen === "docs" && selectedApp && (
        <DocsScreen
          appName={selectedApp.name}
          visibleDocsNodes={visibleDocsNodes}
          docsScrollOffset={docsScrollOffset}
          docsViewportHeight={docsViewportHeight}
          docsLinesCount={docsContent.split("\n").length}
        />
      )}
      {screen === "create" && (
        <CreateScreen
          appName={createAppName}
          languageTemplates={languageTemplates}
          selectedLanguageIndex={selectedLanguageIndex}
        />
      )}
      {isExitConfirmOpen && (
        <Text color="yellow">
          Confirma sair do launcher? Enter/y confirma | n/Esc cancela.
        </Text>
      )}
      {statusMessage && <Text color="cyan">{statusMessage}</Text>}
    </>
  );
}

export function LauncherApp({
  apps,
  repoRoot,
  initialRunViews,
  initialStatusMessage,
}: LauncherAppProps) {
  return (
    <LauncherProvider
      apps={apps}
      repoRoot={repoRoot}
      initialRunViews={initialRunViews}
      initialStatusMessage={initialStatusMessage}
    >
      <LauncherAppContent />
    </LauncherProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add launcher/src/ui/LauncherApp.tsx
git commit -m "refactor: use screen components in LauncherApp"
```

---

### Task 11: Run and verify

- [ ] **Step 1: Build and test**

```bash
cd launcher && npm run build
```

- [ ] **Step 2: Verify no errors**

Expected: Build succeeds without errors

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor: complete launcher UI modularization"
```