#!/bin/bash

# Script para derrubar todos os serviços
# Para o servidor NestJS e derruba o Docker Compose

echo "🛑 Parando serviços..."

# Parar processos do NestJS
echo "📦 Parando servidor NestJS..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "node.*dist/main" 2>/dev/null || true

# Aguardar um pouco para garantir que os processos foram finalizados
sleep 2

# Verificar se ainda há processos rodando na porta 3000
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Ainda há processos na porta 3000, forçando parada..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Derrubar Docker Compose
echo "🐳 Parando containers Docker..."
docker-compose down

echo "✅ Todos os serviços foram parados!"

