#!/usr/bin/env bash
set -euo pipefail

echo "Iniciando verificacao real e estrita do Santuario no Sandbox..."
echo "1/3 - Validando TypeScript (0 erros permitidos: npx tsc --noEmit)..."
npx tsc --noEmit

echo "2/3 - Executando build de producao (npm run build)..."
npm run build

echo "3/3 - Verificando artefato gerado (dist/index.html)..."
if [ ! -f "dist/index.html" ]; then
  echo "ERRO: dist/index.html nao foi gerado pelo build!"
  exit 1
fi

echo "Sucesso real: 0 erros de TypeScript e Vite build 100% OK!"
