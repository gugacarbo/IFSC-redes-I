#!/usr/bin/env bash
# =============================================================
# init-config.sh — Gera arquivos de configuração padrão
# para Matriz e Filial (udp-iot-java).
#
# Uso:
#   ./scripts/init-config.sh              # cria/config com defaults
#   ./scripts/init-config.sh -f           # sobrescreve arquivos existentes
#   ./scripts/init-config.sh --matriz-only   # só gera config da matriz
#   ./scripts/init-config.sh --filial-only   # só gera config da filial
#
# Variáveis de ambiente:
#   PORT_MATRIZ=8080    (REST/WS da matriz)
#   PORT_FILIAL=51000   (UDP da filial)
#   ADMIN_USER=admin
#   ADMIN_PASS=admin
#   POLLING_MS=5000
# =============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$PROJECT_DIR/config"

FORCE=false
GENERATE_MATRIZ=true
GENERATE_FILIAL=true

# ---- Argumentos ----
for arg in "$@"; do
    case "$arg" in
        -f|--force)    FORCE=true ;;
        --matriz-only) GENERATE_FILIAL=false ;;
        --filial-only) GENERATE_MATRIZ=false ;;
        --help|-h)
            sed -n '2,16p' "$0"
            exit 0
            ;;
    esac
done

# ---- Variáveis (com fallback para env vars) ----
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin}"
POLLING_MS="${POLLING_MS:-5000}"
PORT_MATRIZ="${PORT_MATRIZ:-8080}"
PORT_FILIAL="${PORT_FILIAL:-51000}"

# ---- Cria diretório config/ ----
mkdir -p "$CONFIG_DIR"

# =============================================================
#  CONFIG DA MATRIZ
# =============================================================
generate_matriz() {
    local OUT="$CONFIG_DIR/config_matriz.json"

    if [ -f "$OUT" ] && [ "$FORCE" != true ]; then
        echo "⏭  Matriz: $OUT já existe. Use -f | --force para sobrescrever."
        return
    fi

    cat > "$OUT" <<JSON
{
  "user": "${ADMIN_USER}",
  "pass": "${ADMIN_PASS}",
  "pollingMs": ${POLLING_MS},
  "filiais": [
    { "name": "Filial A", "ip": "127.0.0.1", "port": ${PORT_FILIAL} },
    { "name": "Filial B", "ip": "127.0.0.2", "port": ${PORT_FILIAL} }
  ]
}
JSON

    # Pretty-print validation (opcional, se python disponível)
    if command -v python3 &>/dev/null; then
        python3 -m json.tool "$OUT" > /dev/null 2>&1 && \
            echo "✅ Matriz: $OUT (válido)" || \
            echo "⚠️  Matriz: $OUT (erro de validação JSON)"
    else
        echo "✅ Matriz: $OUT"
    fi
}

# =============================================================
#  CONFIG DA FILIAL
# =============================================================
generate_filial() {
    local OUT="$CONFIG_DIR/config_filial.json"

    if [ -f "$OUT" ] && [ "$FORCE" != true ]; then
        echo "⏭  Filial: $OUT já existe. Use -f para sobrescrever."
        return
    fi

    cat > "$OUT" <<JSON
{
  "port": ${PORT_FILIAL},
  "admin_user": "${ADMIN_USER}",
  "admin_pass": "${ADMIN_PASS}",
  "id": [
    "actuator_light_sala",
    "sensor_light_sala",
    "actuator_ac_escritorio",
    "sensor_ac_escritorio"
  ]
}
JSON

    if command -v python3 &>/dev/null; then
        python3 -m json.tool "$OUT" > /dev/null 2>&1 && \
            echo "✅ Filial: $OUT (válido)" || \
            echo "⚠️  Filial: $OUT (erro de validação JSON)"
    else
        echo "✅ Filial: $OUT"
    fi
}

# =============================================================
#  EXECUÇÃO
# =============================================================
echo "📁 Config dir: $CONFIG_DIR"
echo

if [ "$GENERATE_MATRIZ" = true ]; then
    generate_matriz
fi

if [ "$GENERATE_FILIAL" = true ]; then
    generate_filial
fi

echo
echo "✔️  Configurações geradas com sucesso."
echo "   Execute 'java -cp dist matriz.MatrizMain' ou 'npx turbo run dev:matriz' para iniciar."

