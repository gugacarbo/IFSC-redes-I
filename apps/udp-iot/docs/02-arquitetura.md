# Debate de Arquitetura — UDP IoT

> **Data:** 2026-05-12
> **Contexto:** Revisão e implementação das GUIs `matriz-gui` e `filial-gui`

## Estado Original (antes do debate)

### matriz-gui
- React + Vite + Tailwind, parcialmente implementado
- Hook `useIoT.ts` conecta via WebSocket ao `matriz-esp32` (bridge WebSocket↔UDP)
- `Dashboard.tsx` mostra dispositivos por filial mas não inclui `user`/`pass` nos comandos
- `Config.tsx` faz fetch HTTP do `/api/config` do ESP32 — não autônomo
- **Só funciona com hardware ESP32 físico**

### filial-gui
- Boilerplate Vite puro (template padrão com contador)
- Nenhuma funcionalidade IoT implementada

## Decisões de Arquitetura

### 1. matriz-gui deve comunicar via UDP direto

A GUI da matriz **não deve depender do bridge ESP32**. Deve enviar comandos UDP diretamente para as filiais. Como browser não pode abrir socket UDP, cada GUI precisa de um **backend Node.js leve**:

```
[React] ──WebSocket local──► [Node.js backend] ──UDP──► [Filial ESP32 ou Java]
```

### 2. filial-gui = servidor filial + GUI de gerenciamento

A filial-gui não é apenas um configurador — ela **é o próprio servidor UDP da filial**, com:

- Servidor UDP completo (compatível com protocolo `list_req`/`get_status`/`set_req`)
- Gerenciamento de devices em runtime: **adicionar, remover, editar**
- Dashboard mostrando estado dos sensores/atuadores
- Funciona sem hardware ESP32 (para testes)

### 3. Protocolo UDP (compatível ESP32 e Java)

| Comando                   | Direção         | Descrição                      |
| ------------------------- | --------------- | ------------------------------ |
| `list_req` / `list_resp`  | Matriz → Filial | Lista IDs dos dispositivos     |
| `get_status` / `get_resp` | Matriz → Filial | Estados atual de todos devices |
| `set_req` / `set_resp`    | Matriz → Filial | Altera valor de um atuador     |

Autenticação via `user` + `pass` em toda requisição.

### 4. Dispositivos (definidos)

| ID                       | Tipo          | Valor          | Acesso  |
| ------------------------ | ------------- | -------------- | ------- |
| `actuator_light_<local>` | Luz (boolean) | `true`/`false` | Escrita |
| `sensor_light_<local>`   | Luz (boolean) | `true`/`false` | Leitura |
| `actuator_ac_<local>`    | AC (0-1023)   | `0`–`1023`     | Escrita |
| `sensor_ac_<local>`      | AC (0-1023)   | `0`–`1023`     | Leitura |

### 5. Integração Java

A implementação Java (`apps/udp-iot-java/`) será movida para dentro de `apps/udp-iot/java/`, ficando como workspace npm paralelo a `matriz-gui/`, `filial-gui/`, `matriz-esp32/`, `filial-esp32/`.

## Pendências (próximos passos)

- [ ] Integrar `udp-iot-java/` → `udp-iot/java/`
- [ ] Implementar backend Node na matriz-gui (UDP direto)
- [ ] Implementar backend Node + servidor UDP na filial-gui
- [ ] Refatorar useIoT.ts para não depender do bridge ESP32
