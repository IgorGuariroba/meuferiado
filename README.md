# 🗺️ Script de Cidades Vizinhas

Script Node.js para encontrar sua cidade atual e cidades vizinhas usando coordenadas geográficas e **Google Maps Geocoding API**, com armazenamento permanente no **MongoDB** para reduzir chamadas à API.

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

O MongoDB é **opcional** - o script funciona sem ele, mas com MongoDB você:
- ✅ Reduz drasticamente chamadas à API (economia de custos)
- ✅ Consultas muito mais rápidas para cidades já conhecidas
- ✅ Funciona parcialmente offline

## 🎯 Uso

```bash
node cidades_vizinhas.js <latitude> <longitude> <raio_km>
```

### Exemplos

```bash
# Mogi das Cruzes, raio de 30km
node cidades_vizinhas.js -23.5178 -46.1894 30

# São Paulo, raio de 50km
node cidades_vizinhas.js -23.5505 -46.6333 50

# Rio de Janeiro, raio de 30km
node cidades_vizinhas.js -22.9068 -43.1729 30
```

Ou usando npm:
```bash
npm start -- -23.5178 -46.1894 30
```

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

## 📊 Saída

O script exibe:
- **Cidade Atual**: Nome, estado e país
- **Cidades Vizinhas**: Lista de cidades dentro do raio especificado, ordenadas por distância

## 📝 Exemplo de Saída

```
🌍 BUSCA DE CIDADES VIZINHAS

📍 Coordenadas: -23.5178, -46.1894
📏 Raio: 30 km

🔍 Buscando cidade atual...

════════════════════════════════════════════════════════════
🏙️  CIDADE ATUAL
════════════════════════════════════════════════════════════
Cidade: Mogi das Cruzes
Estado: SP
País: BR
Endereço: R. Sen. Feijó, 69 - Centro, Mogi das Cruzes - SP, 08710-230, Brasil

════════════════════════════════════════════════════════════
🗺️  CIDADES VIZINHAS
════════════════════════════════════════════════════════════
🔍 Buscando cidades próximas...

✅ 8 cidade(s) encontrada(s):

1. Mogi das Cruzes
   Estado: SP
   País: BR
   Distância: 9.02 km
   Coordenadas: -23.4367189, -46.1894

2. Biritiba Mirim
   Estado: SP
   País: BR
   Distância: 9.02 km
   Coordenadas: -23.5178, -46.1009739
...
```

## 🆘 Problemas Comuns

### "Cannot find module '@googlemaps/google-maps-services-js'"
```bash
npm install
```

### "❌ ERRO: Geocoding API não está funcionando!"
Verifique:
1. A chave API está correta no arquivo `.env`
2. **Geocoding API** está ativada no Google Cloud Console
3. A chave tem permissão para usar Geocoding API

### "⚠️ MongoDB não disponível"
O script funciona sem MongoDB, mas recomenda-se usá-lo para melhor performance:
1. Verifique se o Docker está rodando: `docker ps`
2. Inicie o MongoDB: `docker-compose up -d`
3. Verifique a string de conexão no `.env`: `MONGODB_URI`

## 💰 Custos

- **Geocoding API**: $5 por 1000 requisições
- Com os **$200 de créditos gratuitos mensais** da Google, você pode fazer muitas buscas sem custo!

## 🔧 Como Funciona

O script usa uma estratégia híbrida **MongoDB + Google Maps API**:

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

---

**Desenvolvido com Node.js, MongoDB e Google Maps Geocoding API** 🚀
