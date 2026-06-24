# Solução de Problemas

## Erro: "Java não encontrado"

- **Solução**: Instale o JDK e configure a variável de ambiente `JAVA_HOME`.

## Erro: "javac não encontrado"

- **Solução**: Verifique se o JDK está instalado corretamente (o `javac` é incluído no JDK).

## Erro: "Turbo não encontrado"

- **Solução**: Execute `npm install` na raiz do projeto para instalar as dependências do monorepo.

## Erro: Turbo 2.x exige campo `packageManager`

- **Solução**: Verifique se o root `package.json` contém o campo `"packageManager": "npm@10.9.2"`.
