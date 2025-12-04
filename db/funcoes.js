const Cidade = require('./models/Cidade');
const Consulta = require('./models/Consulta');

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
 * Busca cidade por coordenadas próximas (raio pequeno ~1km)
 */
async function buscarCidadePorCoordenadas(lat, lon, raioKm = 1) {
    try {
        const cidades = await Cidade.find({
            localizacao: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lon, lat] // [longitude, latitude]
                    },
                    $maxDistance: raioKm * 1000 // Converter km para metros
                }
            }
        }).limit(1);

        if (cidades.length > 0) {
            const cidade = cidades[0];
            return {
                cidade: cidade.nome,
                estado: cidade.estado || '',
                pais: cidade.pais || '',
                endereco_completo: `${cidade.nome}${cidade.estado ? ', ' + cidade.estado : ''}${cidade.pais ? ', ' + cidade.pais : ''}`
            };
        }

        return null;
    } catch (error) {
        console.error('Erro ao buscar cidade por coordenadas:', error.message);
        return null;
    }
}

/**
 * Busca cidades próximas dentro de um raio (em km)
 */
async function buscarCidadesProximas(lat, lon, raioKm) {
    try {
        const cidades = await Cidade.find({
            localizacao: {
                $geoWithin: {
                    $centerSphere: [
                        [lon, lat], // [longitude, latitude]
                        raioKm / 6378.1 // Converter km para radianos (raio da Terra ~6378.1 km)
                    ]
                }
            }
        });

        // Calcular distância exata e ordenar
        const cidadesComDistancia = cidades.map(cidade => {
            const [lonCidade, latCidade] = cidade.localizacao.coordinates;
            const distancia = calcularDistancia(lat, lon, latCidade, lonCidade);

            return {
                nome: cidade.nome,
                estado: cidade.estado || '',
                pais: cidade.pais || '',
                distancia_km: Math.round(distancia * 100) / 100,
                lat: latCidade,
                lon: lonCidade
            };
        });

        // Ordenar por distância
        cidadesComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);

        return cidadesComDistancia;
    } catch (error) {
        console.error('Erro ao buscar cidades próximas:', error.message);
        return [];
    }
}

/**
 * Salva uma cidade no MongoDB (evita duplicatas)
 */
async function salvarCidade(nome, estado, pais, lat, lon) {
    try {
        // Verificar se já existe
        const cidadeExistente = await Cidade.findOne({
            nome: nome,
            estado: estado || '',
            pais: pais || ''
        });

        if (cidadeExistente) {
            return cidadeExistente;
        }

        // Criar nova cidade
        const cidade = new Cidade({
            nome: nome,
            estado: estado || '',
            pais: pais || '',
            localizacao: {
                type: 'Point',
                coordinates: [lon, lat] // [longitude, latitude]
            }
        });

        await cidade.save();
        return cidade;
    } catch (error) {
        // Se erro for de duplicata (índice único), buscar a existente
        if (error.code === 11000) {
            return await Cidade.findOne({
                nome: nome,
                estado: estado || '',
                pais: pais || ''
            });
        }
        console.error('Erro ao salvar cidade:', error.message);
        return null;
    }
}

/**
 * Salva múltiplas cidades (batch)
 */
async function salvarCidades(cidades) {
    const resultados = [];
    for (const cidade of cidades) {
        const resultado = await salvarCidade(
            cidade.nome,
            cidade.estado,
            cidade.pais,
            cidade.lat,
            cidade.lon
        );
        if (resultado) {
            resultados.push(resultado);
        }
    }
    return resultados;
}

/**
 * Salva consulta de cidade atual
 */
async function salvarConsulta(lat, lon, cidadeId) {
    try {
        const consulta = new Consulta({
            coordenadas: { lat, lon },
            cidadeAtual: cidadeId
        });
        await consulta.save();
        return consulta;
    } catch (error) {
        console.error('Erro ao salvar consulta:', error.message);
        return null;
    }
}

module.exports = {
    buscarCidadePorCoordenadas,
    buscarCidadesProximas,
    salvarCidade,
    salvarCidades,
    salvarConsulta
};

