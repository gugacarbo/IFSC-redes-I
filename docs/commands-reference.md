# Referência de Comandos

## Comandos Disponíveis (Turbo)

O Turbo oferece os seguintes comandos padronizados para todos os apps:

| Comando     | Descrição                         |
| ----------- | --------------------------------- |
| `dev`       | Compila e executa o app           |
| `build`     | Apenas compila o código           |
| `test`      | Executa testes (se configurado)   |
| `lint`      | Verifica qualidade do código      |
| `typecheck` | Verifica tipos (quando aplicável) |
| `format`    | Formata o código                  |

## Exemplos de Uso

```bash
# Compilar e executar um app específico
npx turbo run dev --filter=tr1-playlist

# Compilar apenas um app
npx turbo run build --filter=tr2-hash-table

# Executar testes de um app
npx turbo run test --filter=tr1-playlist

# Executar todos os apps
npx turbo run dev
```
