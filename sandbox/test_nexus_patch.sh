#!/usr/bin/env bash
set -euo pipefail

echo "Iniciando verificacao real do Santuario no Sandbox..."
echo "1/3 - Validando tipos TypeScript (npx tsc --noEmit)..."

TSC_OUT=$(mktemp)
set +e
npx tsc --noEmit > "$TSC_OUT" 2>&1
TSC_EXIT=$?
set -e

if [ "$TSC_EXIT" -ne 0 ]; then
  if grep -E '^(App\.tsx|src/|api/|components/CadernoAmanhecer\.tsx)' "$TSC_OUT"; then
    echo "ERRO CRITICO: Erro de TypeScript detectado nos modulos protegidos!"
    cat "$TSC_OUT"
    rm -f "$TSC_OUT"
    exit 1
  fi
  TOTAL_ERRS=$(grep -c "error TS" "$TSC_OUT" || true)
  echo "Aviso de legado: $TOTAL_ERRS erros antigos fora dos modulos protegidos (limite base: 15)."
  if [ "$TOTAL_ERRS" -gt 15 ]; then
    echo "ERRO: Novos erros de TypeScript detectados ($TOTAL_ERRS > 15)!"
    cat "$TSC_OUT"
    rm -f "$TSC_OUT"
    exit 1
  fi
else
  echo "Zero erros de TypeScript em todo o repositorio!"
fi
rm -f "$TSC_OUT"

echo "2/3 - Executando build de producao (npm run build)..."
npm run build

echo "3/3 - Verificando artefato gerado (dist/index.html)..."
if [ ! -f "dist/index.html" ]; then
  echo "ERRO: dist/index.html nao foi gerado pelo build!"
  exit 1
fi

echo "Sucesso real: Sandbox validado (TS protegido 0 erros + Vite build OK)!"
