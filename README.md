# 🗺️ Script de Cidades Vizinhas

Script Node.js para encontrar sua cidade atual e cidades vizinhas usando coordenadas geográficas e **Google Maps Geocoding API**.

## ✨ Por que Geocoding API?

- ✅ **Focada em cidades e localidades** (não comércios)
- ✅ **Mais precisa** para identificar cidades
- ✅ **Mais simples** - apenas uma API necessária
- ✅ **Mais barata** - $5 por 1000 requisições

## 📋 Requisitos

- Node.js 14.0.0 ou superior
- Chave API do Google Maps
- **Geocoding API** ativada no Google Cloud Console

## 🔧 Instalação

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure a chave API no arquivo `.env`:**
```
GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

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

## 💰 Custos

- **Geocoding API**: $5 por 1000 requisições
- Com os **$200 de créditos gratuitos mensais** da Google, você pode fazer muitas buscas sem custo!

## 🔧 Como Funciona

O script usa uma técnica de **amostragem espacial**:
1. Cria pontos em círculos concêntricos ao redor da sua posição
2. Para cada ponto, faz geocodificação reversa (coordenadas → cidade)
3. Filtra e organiza os resultados por distância
4. Remove duplicatas

---

**Desenvolvido com Node.js e Google Maps Geocoding API** 🚀
