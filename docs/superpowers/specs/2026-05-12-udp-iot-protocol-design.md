# Spec: UDP IoT Monitoramento

## 1. Visão Geral
Este documento define a arquitetura técnica e os protocolos para a construção de um sistema de monitoramento e controle remoto de dispositivos IoT. O sistema consiste em uma Matriz (servidor central/proxy) e múltiplas Filiais (controladoras de hardware), utilizando ESP32.

O projeto resolve o problema de alto gasto energético permitindo o monitoramento em tempo real e o controle remoto de luzes e ares-condicionados.

## 2. Arquitetura do Sistema

O sistema é dividido em três módulos principais:
1. **GUI (React SPA):** Roda no navegador do usuário. Interface de monitoramento e gerenciamento.
2. **Matriz (ESP32):** Cliente UDP para as filiais, atua como servidor WebSocket e servidor Web estático para a GUI. É a ponte do sistema.
3. **Filial (ESP32):** Servidor UDP que processa os comandos de leitura (get) e escrita (set) para interagir com o hardware físico (sensores e atuadores).

### 2.1 Fluxo de Dados
*   `GUI <---(WebSocket)---> Matriz`
*   `Matriz <---(UDP 51000)---> Filiais`

## 3. Protocolo de Rede

### 3.1 UDP (Matriz ↔ Filiais)
Conforme requisitos, as mensagens trocadas via UDP unicast (Porta 51000) serão em formato JSON UTF-8. **A autenticação (`user` e `pass`) é obrigatória em todas as requisições.**

**Formatos de Identificação (ID):** `<tipo>_<dispositivo>_<local>`
*   `tipo`: `sensor` (leitura) ou `actuator` (escrita)
*   `dispositivo`: `light` (booleano) ou `ac` (inteiro 0-1023)

**Comandos Suportados:**
1.  **LIST (`list_req` / `list_resp`):** Lista todos os dispositivos registrados na filial.
2.  **GET (`get_status` / `get_resp`):** Solicita o valor atual dos sensores e atuadores.
3.  **SET (`set_req` / `set_resp`):** Altera o valor de um atuador.

### 3.2 WebSocket (GUI ↔ Matriz)
A comunicação da interface web com a matriz usa um padrão de **Proxy Transparente** (Wrapper).

**Responsabilidades:**
*   A GUI **não** envia credenciais.
*   A GUI envelopa o comando com o IP destino (`target_ip`).
*   A Matriz injeta `user` e `pass` globais (armazenados em seu LittleFS) na requisição antes de fazer o envio por UDP.
*   Quando a Matriz recebe uma resposta UDP de uma filial, ela envelopa o JSON recebido com o IP de origem (`source_ip`) e o repassa via WebSocket.

**Layout WS (Envio - GUI para Matriz):**
```json
{
  "type": "ws_tx",
  "target_ip": "192.168.1.100",
  "payload": { "cmd": "set_req", "id": "actuator_light_sala", "value": true }
}
```

**Layout WS (Recepção - Matriz para GUI):**
```json
{
  "type": "ws_rx",
  "source_ip": "192.168.1.100",
  "payload": { "cmd": "get_resp", "actuator_light_sala": true }
}
```

## 4. Gerenciamento e Armazenamento (LittleFS)

### 4.1 Configurações
*   **Filial (`config_filial.json`):** Armazena a porta UDP, `admin_user`, `admin_pass` e o array estático de `id`s dos dispositivos associados àquela filial.
*   **Matriz (`config_matriz.json`):** Armazena as credenciais mestre (`user`/`pass`) usadas para acessar todas as filiais e o array de filiais cadastradas (contendo nome, IP e porta). Também pode armazenar o tempo (intervalo) de polling.

### 4.2 REST API (Matriz)
A Matriz sobe um `AsyncWebServer` na porta 80 que expõe endpoints REST para gerenciamento (CRUD) do arquivo `config_matriz.json` pela GUI:
*   `GET /api/config`: Retorna os dados das filiais cadastradas e configurações globais.
*   `PUT /api/config`: Atualiza a configuração (adicionar/remover filiais, alterar intervalo de polling).
*   `GET /`: Servidor estático para o build do React.

## 5. Lógica de Polling Periódico
Para cumprir o requisito de "atualização periódica":
1. A GUI configura o intervalo de tempo via API REST (salvo no `config_matriz.json`).
2. O firmware da Matriz possui um *loop* (timer/ticker) que, a cada X segundos:
   * Itera sobre todas as filiais cadastradas.
   * Dispara um `list_req` seguido de um `get_status` (via UDP).
3. A Matriz recebe as respostas via UDP e repassa pelo WebSocket.
4. A GUI apenas reage passivamente às mensagens `ws_rx` para atualizar a tela.

## 6. Interface de Usuário (React + shadcn/ui)
*   **Dashboard:** Cards representando cada filial. Switches para controle de luz (booleano) e Sliders para controle de AC (0-1023).
*   **Configurações:** Formulário para adicionar novos IPs/Portas e ajustar a periodicidade do polling.
*   **Build:** O React será gerado via Vite, os assets serão "minificados" (GZIP) e embutidos diretamente na imagem flash do ESP32 da Matriz.
