# Guia do Monorepo

## O que é um Monorepo?

Um monorepo é um repositório que contém múltiplos projetos independentes. Neste caso, cada TR (Trabalho) da disciplina é um "app" separado dentro da pasta `apps/`. Embora os trabalhos sejam independentes entre si, o monorepo oferece:

- **Gerenciamento centralizado**: Um único repositório para todos os trabalhos
- **Automação**: Scripts padronizados para compilar, executar e testar
- **Consistência**: Mesma estrutura de pastas e comandos para todos os TRs

## Estrutura do Projeto

```
IFSC-redes-I/
├── apps/                   # Todos os trabalhos (TRs) ficam aqui
│   ├── tr1-playlist/      # TR1 - Implementação de Playlist
│   └── tr2-hash-table/    # TR2 - Tabela de Dispersão (Hash)
├── docs/                   # Documentação detalhada
├── turbo.json              # Configuração do Turbo (orquestrador)
├── package.json            # Configuração raiz (npm workspaces)
└── AGENTS.md              # Documentação para agentes de IA
```

## Estrutura de um App (TR)

Cada trabalho segue uma estrutura similar:

```
apps/trX-nome/
├── src/              # Código fonte Java
├── package.json      # Scripts do app (build, dev, etc.)
└── README.md         # Instruções específicas do TR
```

## Dicas

- **Apps independentes**: Cada TR é um projeto separado. Se um não compilar, os outros ainda funcionam.
- **Java puro**: Todos os apps usam Java compilado com javac (sem Maven).
- **Turbo**: O Turbo apenas orquestra a execução. O sistema de build real é definido no `package.json` de cada app.
