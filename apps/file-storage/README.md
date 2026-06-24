# File Server

Utilizando o protocolo da camada de transporte **TCP** desenvolva um cliente e um servidor de arquivos (similar ao servidor FTP), porém, em vez de utilizar o protocolo FTP na camada de aplicação, você desenvolverá o seu próprio protocolo baseado no formato **JSON**.

_Para fins de simplificação, esta versão do servidor não suportará a criação e navegação de diretórios (pastas)._

Neste contexto, o servidor e o cliente devem operar com os seguintes comandos:

**LIST_REQ** – cliente solicita a lista de todos os arquivos armazenados no servidor;

```
{ "cmd":"list_req" }
```

**LIST_RESP** – servidor envia ao cliente a lista de todos os arquivos armazenados no servidor;

```
{
 "cmd":"list_resp",
 "files":"<file_list_vector>"
}
```

**PUT_REQ `<file>`** – cliente envia ao servidor o arquivo definido em `<file>`;

```
{
 "cmd":"put_req",
 "file":"<file_name>",
 "hash":"<hash_value>",
 "value":"<file_byte_base64>"
}
```

**PUT_RESP** – servidor envia ao cliente a confirmação de upload do arquivo `<file>`;

```
{
 "cmd":"put_resp",
 "file":"<file_name>",
 "status":"<ok/fail>"
}
```

**GET_REQ `<file>`** – cliente solicita o download do `<file>` armazenado no servidor;

```
{
 "cmd":"get_req",
 "file":"<file_name>"
}
```

**GET_RESP** – servidor envia ao cliente o arquivo definido em `<file>`;

```
{
 "cmd":"get_resp",
 "file":"<file_name>",
 "hash":"<hash_value>",
 "value":"<file_byte_base64>"
}
```

**Os seguintes requisitos técnicos devem ser contemplados:**

- serão desenvolvidas duas aplicações independentes (um servidor e um cliente);
- a aplicação do cliente deve ter interface gráfica (GUI – Graphical User Interface);
- a comunicação entre o cliente e o servidor deve ser realizada obrigatoriamente via protocolo TCP;
- a servidor usa um modelo de FTP anônimo, ou seja, sem autenticação de usuários;
- a interface gráfica deve permitir ao usuário:
  - obter a lista de arquivos existentes no servidor;
  - realizar o download de arquivos;
  - realizar o upload de arquivos;
  - receber aviso de erro em caso de inconsistência do hash;
- o algoritmo de hash a ser utilizado deve ser o **SHA-256**;
- o payload (carga útil) da mensagem deve estar no formato JSON (codificação UTF-8) e seguir rigorosamente o layout definido anteriormente;
