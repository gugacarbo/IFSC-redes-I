# IFSC Redes I

- [Chat UDP](apps/chat-udp/README.md)
- [File Storage](apps/file-storage/README.md)
- [UDP IOT](apps/udp-iot/README.md)

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

3. Launcher

O launcher TUI do monorepo está em `launcher/`.

```bash
npm run start
```

## Pré-requisitos

- Node.js (v18 ou superior) — para uso do npm e Turbo
- Java JDK (v8 ou superior) — para compilar e executar os trabalhos

Verifique se as ferramentas estão instaladas:

```bash
node --version
java --version
javac --version
```

## Documentação

- [Guia do Monorepo](docs/monorepo-guide.md) (estrutura, dicas, detalhes técnicos)
- [Referência de Comandos](docs/commands-reference.md)
- [Solução de Problemas](docs/troubleshooting.md)
