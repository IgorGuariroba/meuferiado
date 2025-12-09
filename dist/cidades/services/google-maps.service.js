"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleMapsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const axios_1 = __importDefault(require("axios"));
const calcular_distancia_util_1 = require("../../common/utils/calcular-distancia.util");
let GoogleMapsService = class GoogleMapsService {
    constructor(configService) {
        this.configService = configService;
        this.client = new google_maps_services_js_1.Client({});
        this.apiKey = this.configService.get('GOOGLE_MAPS_API_KEY') || '';
    }
    async buscarPorEndereco(endereco) {
        try {
            const response = await this.client.geocode({
                params: {
                    address: endereco,
                    key: this.apiKey,
                    language: 'pt-BR',
                },
            });
            if (!response.data.results?.length) {
                throw new Error('Endereço não encontrado');
            }
            const resultado = response.data.results[0];
            const geometry = (resultado.geometry || {});
            const location = geometry.location || {};
            if (!location.lat || !location.lng) {
                throw new Error('Coordenadas não encontradas para o endereço');
            }
            let cidade = '', estado = '', pais = '';
            for (const comp of resultado.address_components || []) {
                const tipos = (comp.types || []);
                if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
                    cidade = comp.long_name;
                }
                else if (tipos.includes('administrative_area_level_1')) {
                    estado = comp.short_name;
                }
                else if (tipos.includes('country')) {
                    pais = comp.short_name;
                }
            }
            return {
                cidade: cidade || resultado.formatted_address || 'Não encontrada',
                estado,
                pais,
                endereco_completo: resultado.formatted_address,
                coordenadas: {
                    lat: location.lat,
                    lon: location.lng,
                },
            };
        }
        catch (error) {
            throw new Error(`Erro ao buscar endereço: ${error.message}`);
        }
    }
    async obterCidadeAtual(lat, lon) {
        try {
            const response = await this.client.reverseGeocode({
                params: {
                    latlng: { lat, lng: lon },
                    key: this.apiKey,
                    language: 'pt-BR',
                },
            });
            if (!response.data.results?.length) {
                return { cidade: 'Não encontrada', estado: '', pais: '', endereco_completo: '' };
            }
            const endereco = response.data.results[0];
            let cidade = '', estado = '', pais = '';
            for (const comp of endereco.address_components || []) {
                const tipos = (comp.types || []);
                if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
                    cidade = comp.long_name;
                }
                else if (tipos.includes('administrative_area_level_1')) {
                    estado = comp.short_name;
                }
                else if (tipos.includes('country')) {
                    pais = comp.short_name;
                }
            }
            return {
                cidade: cidade || endereco.formatted_address || 'Não encontrada',
                estado,
                pais,
                endereco_completo: endereco.formatted_address,
                coordenadas: {
                    lat: endereco.geometry?.location?.lat || lat,
                    lon: endereco.geometry?.location?.lng || lon,
                },
            };
        }
        catch (error) {
            throw new Error(`Erro na geocodificação: ${error.message}`);
        }
    }
    async obterCidadesVizinhas(lat, lon, raioKm) {
        const cidadesMap = new Map();
        const pontosVerificados = new Set();
        try {
            for (const raioAtual of [raioKm * 0.3, raioKm * 0.6, raioKm * 0.9, raioKm]) {
                const numPontosCirculo = Math.max(4, Math.floor(raioAtual / 5));
                const anguloPasso = 360 / numPontosCirculo;
                for (let i = 0; i < numPontosCirculo; i++) {
                    const angulo = (i * anguloPasso) * Math.PI / 180;
                    const latOffset = (raioAtual / 111.0) * Math.cos(angulo);
                    const lonOffset = (raioAtual / 111.0) * Math.sin(angulo) / Math.cos(lat * Math.PI / 180);
                    const latPonto = lat + latOffset;
                    const lonPonto = lon + lonOffset;
                    const pontoKey = `${Math.round(latPonto * 1000) / 1000},${Math.round(lonPonto * 1000) / 1000}`;
                    if (pontosVerificados.has(pontoKey))
                        continue;
                    pontosVerificados.add(pontoKey);
                    try {
                        const resultados = await this.client.reverseGeocode({
                            params: {
                                latlng: { lat: latPonto, lng: lonPonto },
                                key: this.apiKey,
                                language: 'pt-BR',
                            },
                        });
                        if (resultados.data.results && resultados.data.results.length > 0) {
                            const endereco = resultados.data.results[0];
                            let cidadeNome = '', estado = '', pais = '';
                            for (const componente of endereco.address_components || []) {
                                const tipos = (componente.types || []);
                                if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
                                    cidadeNome = componente.long_name || '';
                                }
                                else if (tipos.includes('administrative_area_level_1')) {
                                    estado = componente.short_name || '';
                                }
                                else if (tipos.includes('country')) {
                                    pais = componente.short_name || '';
                                }
                            }
                            if (!cidadeNome) {
                                const partes = (endereco.formatted_address || '').split(',');
                                if (partes.length > 0) {
                                    cidadeNome = partes[0].trim();
                                }
                            }
                            const geometry = (endereco.geometry || {});
                            const location = geometry.location || {};
                            const latLugar = location.lat || latPonto;
                            const lonLugar = location.lng || lonPonto;
                            const distancia = (0, calcular_distancia_util_1.calcularDistancia)(lat, lon, latLugar, lonLugar);
                            if (distancia <= raioKm && cidadeNome) {
                                const nomeKey = cidadeNome.toLowerCase();
                                if (!cidadesMap.has(nomeKey)) {
                                    cidadesMap.set(nomeKey, {
                                        nome: cidadeNome,
                                        estado,
                                        pais,
                                        distancia_km: Math.round(distancia * 100) / 100,
                                        lat: latLugar,
                                        lon: lonLugar,
                                    });
                                }
                            }
                        }
                    }
                    catch (err) {
                        continue;
                    }
                }
            }
            const cidades = Array.from(cidadesMap.values())
                .sort((a, b) => a.distancia_km - b.distancia_km);
            return cidades.slice(0, 20);
        }
        catch (error) {
            throw new Error(`Erro ao buscar cidades vizinhas: ${error.message}`);
        }
    }
    async buscarLocaisPorCidade(query, city) {
        try {
            if (!this.apiKey) {
                throw new Error('Chave da API do Google Maps não configurada. Configure GOOGLE_MAPS_API_KEY no arquivo .env');
            }
            const searchQuery = `${query} em ${city}`;
            const response = await axios_1.default.post('https://places.googleapis.com/v1/places:searchText', {
                textQuery: searchQuery,
                languageCode: 'pt-BR',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.priceLevel',
                },
            });
            if (!response.data.places?.length) {
                return [];
            }
            return response.data.places.map((place) => {
                const location = place.location || {};
                return {
                    nome: place.displayName?.text || 'Sem nome',
                    endereco: place.formattedAddress || '',
                    coordenadas: {
                        lat: location.latitude || null,
                        lon: location.longitude || null,
                    },
                    rating: place.rating || null,
                    total_avaliacoes: place.userRatingCount || null,
                    tipos: place.types || [],
                    place_id: place.id?.replace('places/', '') || null,
                    nivel_preco: place.priceLevel || null,
                };
            });
        }
        catch (error) {
            if (error.response?.status === 403) {
                throw new Error('Erro 403: Places API (New) não está habilitada ou a chave de API não tem permissão. ' +
                    'Verifique no Google Cloud Console se a Places API (New) está habilitada e se a chave tem as permissões corretas. ' +
                    'A nova API requer habilitar "Places API (New)" especificamente.');
            }
            if (error.response?.status === 400) {
                const errorMessage = error.response.data?.error?.message || error.message;
                throw new Error(`Erro na requisição: ${errorMessage}`);
            }
            throw new Error(`Erro ao buscar locais: ${error.message}`);
        }
    }
};
exports.GoogleMapsService = GoogleMapsService;
exports.GoogleMapsService = GoogleMapsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleMapsService);
//# sourceMappingURL=google-maps.service.js.map