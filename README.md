# IFSC Redes I

- [TR1 - Playlist](apps/tr1-playlist/README.md)
- [TR2 - Tabela Hash](apps/tr2-hash-table/README.md)
- [Launcher TUI](launcher/)

## Pré-requisitos

- Node.js (v18 ou superior) — para uso do npm e Turbo
- Java JDK (v8 ou superior) — para compilar e executar os trabalhos

Verifique se as ferramentas estão instaladas:

```bash
node --version
java --version
javac --version
```

## Configuração Inicial

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd IFSC-redes-I
```

2. Instale as dependências:

```bash
npm install
```

## Como Executar os Apps

Use o Turbo com a flag `--filter` para rodar um TR específico:

```bash
# TR1 - Playlist
npx turbo run dev --filter=tr1-playlist

# TR2 - Tabela de Dispersão
npx turbo run dev --filter=tr2-hash-table
```

Para compilar e executar todos os trabalhos de uma vez:

```bash
npx turbo run dev
```

## Launcher

O launcher TUI do monorepo está em `launcher/`.

```bash
npm run start
```

## Documentação

- [Guia do Monorepo](docs/monorepo-guide.md) (estrutura, dicas, detalhes técnicos)
- [Referência de Comandos](docs/commands-reference.md)
- [Solução de Problemas](docs/troubleshooting.md)
