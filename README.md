# 🗺️ API de Cidades Vizinhas e Locais de Hospedagem

API REST desenvolvida com NestJS para encontrar cidade atual e cidades vizinhas usando coordenadas geográficas ou nome de cidade/endereço. Também gerencia locais de hospedagem (Casa de praia, Chalé, Pousada, etc.) com filtros por tipo, preço e localização. Utiliza **Google Maps Geocoding API** para geocodificação e **MongoDB** para armazenamento.

## ✨ Por que Geocoding API?

- ✅ **Focada em cidades e localidades** (não comércios)
- ✅ **Mais precisa** para identificar cidades
- ✅ **Mais simples** - apenas uma API necessária
- ✅ **Mais barata** - $5 por 1000 requisições

## 📋 Requisitos

- Node.js 14.0.0 ou superior (recomendado 18+)
- Chave API do Google Maps
- **Geocoding API** ativada no Google Cloud Console
- **MongoDB** (opcional, mas recomendado) - pode rodar em Docker

## 🔧 Instalação

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure a chave API no arquivo `.env`:**
```
GOOGLE_MAPS_API_KEY=sua_chave_aqui
MONGODB_URI=mongodb://admin:admin123@localhost:27017/cidades?authSource=admin
```

3. **Inicie o MongoDB (Docker):**
```bash
docker-compose up -d
```

O MongoDB é **opcional** - a API funciona sem ele, mas com MongoDB você:
- ✅ Reduz drasticamente chamadas à API (economia de custos)
- ✅ Consultas muito mais rápidas para cidades já conhecidas
- ✅ Funciona parcialmente offline

## 🚀 Como Iniciar

### Modo Desenvolvimento (com hot-reload)
```bash
npm run dev
```

### Modo Produção
```bash
# Compilar o projeto
npm run build

# Iniciar servidor
npm start
```

A API estará disponível em:
- **API**: http://localhost:3000/api
- **Swagger/OpenAPI Docs**: http://localhost:3000/docs

## 🎯 Uso da API

A API possui dois grupos principais de endpoints:

### 📍 Cidades
- Buscar cidade atual por coordenadas
- Buscar cidades vizinhas
- Buscar cidade por nome/endereço

### 🏨 Locais de Hospedagem
- Criar local de hospedagem
- Listar locais com filtros (tipo, preço, localização)
- Buscar local por ID
- Atualizar local
- Deletar local

### Documentação Interativa

Acesse http://localhost:3000/docs para ver a documentação completa do Swagger com todos os endpoints disponíveis e testá-los diretamente no navegador.

## 🔑 Como Obter a Chave API

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a **Geocoding API**:
   - Vá em "APIs e Serviços" → "Biblioteca"
   - Pesquise: "Geocoding API"
   - Clique em "ATIVAR"
4. Crie uma chave API:
   - Vá em "Credenciais" → "Criar credenciais" → "Chave de API"
   - Copie a chave
5. Adicione ao arquivo `.env`:
   ```
   GOOGLE_MAPS_API_KEY=sua_chave_aqui
   ```

## 📊 Respostas da API

A API retorna dados em formato JSON com a seguinte estrutura:

```json
{
  "success": true,
  "data": {
    // Dados da resposta
  }
}
```

### Exemplo de Resposta - Cidades Vizinhas

```json
{
  "success": true,
  "data": {
    "cidadeAtual": {
      "nome": "Mogi das Cruzes",
      "estado": "SP",
      "pais": "BR",
      "coordenadas": {
        "lat": -23.5178,
        "lon": -46.1894
      }
    },
    "cidadesVizinhas": [
      {
        "nome": "Biritiba Mirim",
        "estado": "SP",
        "pais": "BR",
        "distancia": 9.02,
        "coordenadas": {
          "lat": -23.5178,
          "lon": -46.1009739
        }
      }
    ]
  }
}
```

## 🆘 Problemas Comuns

### "Cannot find module '@nestjs/core'"
```bash
npm install
```

### "❌ ERRO: Geocoding API não está funcionando!"
Verifique:
1. A chave API está correta no arquivo `.env`
2. **Geocoding API** está ativada no Google Cloud Console
3. A chave tem permissão para usar Geocoding API

### "⚠️ MongoDB não disponível"
A API funciona sem MongoDB, mas recomenda-se usá-lo para melhor performance:
1. Verifique se o Docker está rodando: `docker ps`
2. Inicie o MongoDB: `docker-compose up -d`
3. Verifique a string de conexão no `.env`: `MONGODB_URI`

### "Port 3000 is already in use"
```bash
# Parar processos na porta 3000
npm run service:down

# Ou manualmente
lsof -ti:3000 | xargs kill -9
```

## 💰 Custos

- **Geocoding API**: $5 por 1000 requisições
- Com os **$200 de créditos gratuitos mensais** da Google, você pode fazer muitas buscas sem custo!

## 🔧 Como Funciona

A API usa uma estratégia híbrida **MongoDB + Google Maps API**:

### Fluxo de Busca Otimizado:

1. **Busca no MongoDB primeiro** (se disponível):
   - Usa queries geográficas nativas (`$geoWithin`, `$near`)
   - Se encontrar cidades suficientes → retorna do banco (sem chamar API)

2. **Se não encontrar no MongoDB** → consulta API do Google Maps:
   - Usa técnica de **amostragem espacial**
   - Cria pontos em círculos concêntricos ao redor da posição
   - Para cada ponto, faz geocodificação reversa (coordenadas → cidade)
   - Filtra e organiza os resultados por distância
   - Remove duplicatas

3. **Salva novas cidades no MongoDB**:
   - Armazena permanentemente para próximas consultas
   - Evita duplicatas com índice único

### Benefícios do MongoDB:

- **Performance**: Queries geográficas nativas são muito rápidas
- **Economia**: Reduz chamadas à API (custo $5/1000 requisições)
- **Escalabilidade**: Uma cidade armazenada serve para infinitas consultas
- **Offline**: Funciona parcialmente offline para cidades já conhecidas

## 🗄️ MongoDB

### Estrutura de Dados

O MongoDB armazena cidades individuais com:
- Nome, estado, país
- Coordenadas geográficas (índice 2dsphere)
- Índice único para evitar duplicatas

### Comandos Úteis

```bash
# Iniciar MongoDB
docker-compose up -d

# Parar MongoDB
docker-compose down

# Ver logs do MongoDB
docker-compose logs -f mongodb

# Acessar shell do MongoDB
docker exec -it cidades-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

### Limpar Dados (se necessário)

```bash
# Parar e remover volumes
docker-compose down -v
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Compilar para produção
npm run build

# Iniciar em produção
npm start

# Testes
npm test
npm run test:watch
npm run test:cov

# Parar serviços (NestJS + Docker)
npm run service:down
npm run down:volumes
```

---

**Desenvolvido com NestJS, MongoDB e Google Maps Geocoding API** 🚀
