#!/usr/bin/env node
/**
 * Script para encontrar cidade atual e cidades vizinhas
 * usando coordenadas, raio em km e Google Maps Geocoding API
 * Versão Node.js - Usa apenas Geocoding API (ideal para encontrar cidades)
 */

const { Client } = require('@googlemaps/google-maps-services-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Calcula distância entre coordenadas (Haversine)
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Obtém informações da cidade atual via Geocoding
 */
async function obterCidadeAtual(lat, lon, apiKey) {
    try {
        const client = new Client({});
        const response = await client.reverseGeocode({
            params: {
                latlng: { lat, lng: lon },
                key: apiKey,
                language: 'pt-BR'
            }
        });

        if (!response.data.results?.length) {
            return { cidade: "Não encontrada", estado: "", pais: "" };
        }

        const endereco = response.data.results[0];
        let cidade = "", estado = "", pais = "";

        for (const comp of endereco.address_components || []) {
            const tipos = comp.types || [];

            if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
                cidade = comp.long_name;
            } else if (tipos.includes('administrative_area_level_1')) {
                estado = comp.short_name;
            } else if (tipos.includes('country')) {
                pais = comp.short_name;
            }
        }

        return {
            cidade: cidade || endereco.formatted_address || 'Não encontrada',
            estado,
            pais,
            endereco_completo: endereco.formatted_address
        };
    } catch (error) {
        console.error(`❌ Erro na geocodificação: ${error.message}`);
        return { cidade: "Erro", estado: "", pais: "" };
    }
}

/**
 * Busca cidades vizinhas usando Geocoding API
 * Método ideal para encontrar cidades (não comércios)
 */
async function obterCidadesVizinhas(lat, lon, raioKm, apiKey) {
    const cidadesMap = new Map();
    const client = new Client({});
    const pontosVerificados = new Set();

    try {
        // Criar pontos em círculos concêntricos ao redor da coordenada central
        // Isso permite encontrar cidades próximas fazendo geocodificação reversa
        for (const raioAtual of [raioKm * 0.3, raioKm * 0.6, raioKm * 0.9, raioKm]) {
            const numPontosCirculo = Math.max(4, Math.floor(raioAtual / 5));
            const anguloPasso = 360 / numPontosCirculo;

            for (let i = 0; i < numPontosCirculo; i++) {
                const angulo = (i * anguloPasso) * Math.PI / 180;
                const latOffset = (raioAtual / 111.0) * Math.cos(angulo);
                const lonOffset = (raioAtual / 111.0) * Math.sin(angulo) / Math.cos(lat * Math.PI / 180);

                const latPonto = lat + latOffset;
                const lonPonto = lon + lonOffset;

                // Arredondar para evitar pontos muito próximos
                const pontoKey = `${Math.round(latPonto * 1000) / 1000},${Math.round(lonPonto * 1000) / 1000}`;
                if (pontosVerificados.has(pontoKey)) continue;
                pontosVerificados.add(pontoKey);

                try {
                    const resultados = await client.reverseGeocode({
                        params: {
                            latlng: { lat: latPonto, lng: lonPonto },
                            key: apiKey,
                            language: 'pt-BR'
                        }
                    });

                    if (resultados.data.results && resultados.data.results.length > 0) {
                        const endereco = resultados.data.results[0];
                        let cidadeNome = "";
                        let estado = "";
                        let pais = "";

                        // Extrair informações do endereço
                        for (const componente of endereco.address_components || []) {
                            const tipos = componente.types || [];

                            if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
                                cidadeNome = componente.long_name || '';
                            } else if (tipos.includes('administrative_area_level_1')) {
                                estado = componente.short_name || '';
                            } else if (tipos.includes('country')) {
                                pais = componente.short_name || '';
                            }
                        }

                        // Se não encontrou cidade, tentar pegar do formatted_address
                        if (!cidadeNome) {
                            const partes = (endereco.formatted_address || '').split(',');
                            if (partes.length > 0) {
                                cidadeNome = partes[0].trim();
                            }
                        }

                        // Obter coordenadas exatas do lugar
                        const geometry = endereco.geometry || {};
                        const location = geometry.location || {};
                        const latLugar = location.lat || latPonto;
                        const lonLugar = location.lng || lonPonto;

                        // Calcular distância exata
                        const distancia = calcularDistancia(lat, lon, latLugar, lonLugar);

                        // Adicionar se estiver no raio e for uma cidade válida
                        if (distancia <= raioKm && cidadeNome) {
                            const nomeKey = cidadeNome.toLowerCase();
                            if (!cidadesMap.has(nomeKey)) {
                                cidadesMap.set(nomeKey, {
                                    nome: cidadeNome,
                                    estado: estado,
                                    pais: pais,
                                    distancia_km: Math.round(distancia * 100) / 100,
                                    lat: latLugar,
                                    lon: lonLugar
                                });
                            }
                        }
                    }
                } catch (err) {
                    // Ignorar erros em pontos específicos
                    continue;
                }
            }
        }

        // Converter Map para array e ordenar por distância
        const cidades = Array.from(cidadesMap.values())
            .sort((a, b) => a.distancia_km - b.distancia_km);

        return { cidades: cidades.slice(0, 20), apiAtiva: true }; // Limitar a 20 resultados

    } catch (error) {
        console.error(`❌ Erro ao buscar cidades vizinhas: ${error.message}`);
        return { cidades: [], apiAtiva: false };
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('\n🌍 BUSCA DE CIDADES VIZINHAS\n');

    // Validar API Key
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
        console.error('❌ ERRO: Variável GOOGLE_MAPS_API_KEY não encontrada!\n');
        console.error('Configure o arquivo .env com sua chave API do Google Maps.');
        console.error('Visite: https://console.cloud.google.com/\n');
        process.exit(1);
    }

    // Validar argumentos
    if (process.argv.length < 5) {
        console.error('Uso: node cidades_vizinhas.js <latitude> <longitude> <raio_km>\n');
        console.error('Exemplo: node cidades_vizinhas.js -23.5505 -46.6333 50');
        console.error('         (São Paulo, raio de 50km)\n');
        process.exit(1);
    }

    const lat = parseFloat(process.argv[2]);
    const lon = parseFloat(process.argv[3]);
    const raioKm = parseFloat(process.argv[4]);

    if (isNaN(lat) || isNaN(lon) || isNaN(raioKm)) {
        console.error('❌ ERRO: Coordenadas e raio devem ser números válidos!\n');
        process.exit(1);
    }

    console.log(`📍 Coordenadas: ${lat}, ${lon}`);
    console.log(`📏 Raio: ${raioKm} km\n`);

    // Obter cidade atual
    console.log('🔍 Buscando cidade atual...');
    const cidadeAtual = await obterCidadeAtual(lat, lon, googleApiKey);

    console.log('\n' + '═'.repeat(60));
    console.log('🏙️  CIDADE ATUAL');
    console.log('═'.repeat(60));
    console.log(`Cidade: ${cidadeAtual.cidade}`);
    if (cidadeAtual.estado) console.log(`Estado: ${cidadeAtual.estado}`);
    if (cidadeAtual.pais) console.log(`País: ${cidadeAtual.pais}`);
    if (cidadeAtual.endereco_completo) {
        console.log(`Endereço: ${cidadeAtual.endereco_completo}`);
    }

    // Obter cidades vizinhas
    console.log('\n' + '═'.repeat(60));
    console.log('🗺️  CIDADES VIZINHAS');
    console.log('═'.repeat(60));
    console.log('🔍 Buscando cidades próximas...\n');

    const resultado = await obterCidadesVizinhas(lat, lon, raioKm, googleApiKey);

    if (!resultado.apiAtiva) {
        console.error('❌ ERRO: Geocoding API não está funcionando!\n');
        console.error('Verifique:');
        console.error('1. A chave API está correta no arquivo .env');
        console.error('2. Geocoding API está ativada no Google Cloud Console');
        console.error('3. A chave tem permissão para usar Geocoding API\n');
        process.exit(1);
    }

    const cidades = resultado.cidades;

    if (cidades.length === 0) {
        console.log('⚠️  Nenhuma cidade encontrada no raio especificado.\n');
        process.exit(0);
    }

    console.log(`✅ ${cidades.length} cidade(s) encontrada(s):\n`);

    cidades.forEach((cidade, index) => {
        console.log(`${index + 1}. ${cidade.nome}`);
        if (cidade.estado) console.log(`   Estado: ${cidade.estado}`);
        if (cidade.pais) console.log(`   País: ${cidade.pais}`);
        console.log(`   Distância: ${cidade.distancia_km} km`);
        console.log(`   Coordenadas: ${cidade.lat}, ${cidade.lon}\n`);
    });

    console.log('═'.repeat(60) + '\n');
}

// Executar
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = {
    calcularDistancia,
    obterCidadeAtual,
    obterCidadesVizinhas
};
