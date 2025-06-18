#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Log environment
echo "=== Environment Variables ==="
printenv | sort
echo "==========================="

echo "=== System Information ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
which node
which npm

# Verifica se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "ERRO: Não foi encontrado o package.json no diretório atual"
  ls -la
  exit 1
fi

echo "\n=== Instalando dependências ==="
npm ci --no-audit --prefer-offline

if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao instalar dependências"
  exit 1
fi

echo "\n=== Construindo a aplicação ==="
npm run build

# Verifica se o build foi bem-sucedido
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao construir a aplicação"
  exit 1
fi

echo "\n=== Verificando arquivos gerados ==="
ls -la dist/

# Verifica se o arquivo principal foi gerado
if [ ! -f "dist/server.js" ]; then
  echo "ERRO: dist/server.js não encontrado!"
  echo "Conteúdo do diretório dist/:"
  ls -la dist/
  exit 1
fi

echo "\n=== Build concluído com sucesso! ==="
node -e "console.log('Node.js está funcionando corretamente')"
exit 0