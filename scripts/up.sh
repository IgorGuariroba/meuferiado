#!/bin/bash

# Script para subir todos os serviços
# Sobe o Docker Compose e inicia o servidor NestJS

echo "🚀 Iniciando serviços..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
  exit 1
fi

# Subir Docker Compose
echo "🐳 Subindo containers Docker (MongoDB)..."
docker-compose up -d

# Aguardar MongoDB estar pronto
echo "⏳ Aguardando MongoDB estar pronto..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec cidades-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB está pronto!"
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "⚠️  MongoDB pode não estar totalmente pronto, mas continuando..."
fi

# Verificar se a aplicação já está rodando
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Aplicação já está rodando na porta 3000"
  echo "💡 Use 'npm run down' para parar antes de subir novamente"
  exit 1
fi

# Subir aplicação NestJS
echo "📦 Iniciando servidor NestJS..."
npm run dev

