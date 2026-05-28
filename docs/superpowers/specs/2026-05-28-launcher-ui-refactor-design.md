# Launcher UI Refactor - Design

## Visão Geral

Refatorar o launcher para melhorar layout, espaçamento, alinhamento e hierarquia visual, com organização de código modular.

## Arquitetura

### Estrutura de Telas

```
src/ui/screens/
├── AppsScreen.tsx      # Lista de apps
├── ScriptsScreen.tsx   # Scripts do app selecionado
├── RunScreen.tsx     # Terminais em execução
├── DocsScreen.tsx    # Documentação
└── CreateScreen.tsx  # Criar novo app
```

### Componentes Reutilizáveis

```
src/ui/components/
├── Header.tsx        # Cabeçalho com título
├── Footer.tsx        # Rodapé com instruções
├── List.tsx        # Lista com destaque
├── StatusBadge.tsx # Badge de status
└── Theme.ts      # Estilos centralizados
```

## Design de Telas

### AppsScreen
- Header: Título centralizado "IFSC Estrutura de Dados - Launcher"
- Conteúdo: Lista de apps com 1 linha de espaçamento
- Footer: Instruções de navegação

### ScriptsScreen
- Header: Nome do app selecionado
- Conteúdo: Lista de scripts com destaque verde
- Footer: Instruções (Enter, Esc, t, n, d)

### RunScreen
- Header: Contadores (Executando: X | Finalizados: Y | Total: Z)
- Conteúdo: Lista de terminais com status colorido
- Footer: Controles (Setas, k, x, c, Esc/b)

### DocsScreen
- Header: "Documentação: Nome do App"
- Conteúdo: Markdown renderizado com scroll
- Footer: Posição atual (Linhas X-Y de Z)

### CreateScreen
- Header: "Criar App"
- Conteúdo: Campo nome + lista de linguagens
- Footer: Instruções (Enter, Esc)

## Organização de Código

- Separar LauncherApp.tsx em telas individuais
- Criar Theme.ts com cores e espaçamentos
- Componentes reutilizáveis para consistência
- Manter hooks e context existentes

## Critérios de Sucesso

- Espaçamento consistente entre elementos
- Alinhamento visual claro
- Hierarquia de informações bem definida
- Código modular e maintível