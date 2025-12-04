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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CidadesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cidade_schema_1 = require("../schemas/cidade.schema");
const google_maps_service_1 = require("./google-maps.service");
const calcular_distancia_util_1 = require("../../common/utils/calcular-distancia.util");
let CidadesService = class CidadesService {
    constructor(cidadeModel, googleMapsService) {
        this.cidadeModel = cidadeModel;
        this.googleMapsService = googleMapsService;
    }
    async buscarCidadePorCoordenadas(lat, lon, raioKm = 1) {
        try {
            const cidades = await this.cidadeModel.find({
                localizacao: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lon, lat],
                        },
                        $maxDistance: raioKm * 1000,
                    },
                },
            }).limit(1);
            if (cidades.length > 0) {
                const cidade = cidades[0];
                return {
                    cidade: cidade.nome,
                    estado: cidade.estado || '',
                    pais: cidade.pais || '',
                    endereco_completo: `${cidade.nome}${cidade.estado ? ', ' + cidade.estado : ''}${cidade.pais ? ', ' + cidade.pais : ''}`,
                };
            }
            return null;
        }
        catch (error) {
            console.error('Erro ao buscar cidade por coordenadas:', error.message);
            return null;
        }
    }
    async buscarCidadesProximas(lat, lon, raioKm) {
        try {
            const cidades = await this.cidadeModel.find({
                localizacao: {
                    $geoWithin: {
                        $centerSphere: [
                            [lon, lat],
                            raioKm / 6378.1,
                        ],
                    },
                },
            });
            const cidadesComDistancia = cidades.map(cidade => {
                const [lonCidade, latCidade] = cidade.localizacao.coordinates;
                const distancia = (0, calcular_distancia_util_1.calcularDistancia)(lat, lon, latCidade, lonCidade);
                return {
                    nome: cidade.nome,
                    estado: cidade.estado || '',
                    pais: cidade.pais || '',
                    distancia_km: Math.round(distancia * 100) / 100,
                    lat: latCidade,
                    lon: lonCidade,
                };
            });
            cidadesComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);
            return cidadesComDistancia;
        }
        catch (error) {
            console.error('Erro ao buscar cidades próximas:', error.message);
            return [];
        }
    }
    async salvarCidade(nome, estado, pais, lat, lon) {
        try {
            const cidadeExistente = await this.cidadeModel.findOne({
                nome,
                estado: estado || '',
                pais: pais || '',
            });
            if (cidadeExistente) {
                return cidadeExistente;
            }
            const cidade = new this.cidadeModel({
                nome,
                estado: estado || '',
                pais: pais || '',
                localizacao: {
                    type: 'Point',
                    coordinates: [lon, lat],
                },
            });
            await cidade.save();
            return cidade;
        }
        catch (error) {
            if (error.code === 11000) {
                return await this.cidadeModel.findOne({
                    nome,
                    estado: estado || '',
                    pais: pais || '',
                });
            }
            console.error('Erro ao salvar cidade:', error.message);
            return null;
        }
    }
    async salvarCidades(cidades) {
        const resultados = [];
        for (const cidade of cidades) {
            const resultado = await this.salvarCidade(cidade.nome, cidade.estado, cidade.pais, cidade.lat, cidade.lon);
            if (resultado) {
                resultados.push(resultado);
            }
        }
        return resultados;
    }
    async obterCidadeAtual(lat, lon) {
        const cidadeMongo = await this.buscarCidadePorCoordenadas(lat, lon, 1);
        if (cidadeMongo) {
            return { ...cidadeMongo, doMongoDB: true };
        }
        const cidadeApi = await this.googleMapsService.obterCidadeAtual(lat, lon);
        if (cidadeApi.cidade && cidadeApi.cidade !== 'Não encontrada') {
            await this.salvarCidade(cidadeApi.cidade, cidadeApi.estado, cidadeApi.pais, cidadeApi.coordenadas.lat, cidadeApi.coordenadas.lon);
        }
        return { ...cidadeApi, doMongoDB: false };
    }
    async obterCidadesVizinhas(lat, lon, raioKm) {
        const cidadesMongo = await this.buscarCidadesProximas(lat, lon, raioKm);
        if (cidadesMongo.length >= 3) {
            return { cidades: cidadesMongo, doMongoDB: true };
        }
        const cidadesApi = await this.googleMapsService.obterCidadesVizinhas(lat, lon, raioKm);
        if (cidadesApi.length > 0) {
            await this.salvarCidades(cidadesApi);
        }
        const todasCidades = [...cidadesMongo, ...cidadesApi];
        const cidadesUnicas = new Map();
        for (const cidade of todasCidades) {
            const key = `${cidade.nome.toLowerCase()}_${cidade.estado}_${cidade.pais}`;
            if (!cidadesUnicas.has(key)) {
                cidadesUnicas.set(key, cidade);
            }
        }
        const resultado = Array.from(cidadesUnicas.values())
            .sort((a, b) => a.distancia_km - b.distancia_km);
        return { cidades: resultado, doMongoDB: false };
    }
    async listarTodasCidades(limit, skip) {
        try {
            const query = this.cidadeModel.find().sort({ criadoEm: -1 });
            if (skip) {
                query.skip(skip);
            }
            if (limit) {
                query.limit(limit);
            }
            const cidades = await query.exec();
            const total = await this.cidadeModel.countDocuments();
            return {
                cidades: cidades.map(cidade => ({
                    nome: cidade.nome,
                    estado: cidade.estado || '',
                    pais: cidade.pais || '',
                    lat: cidade.localizacao.coordinates[1],
                    lon: cidade.localizacao.coordinates[0],
                    criadoEm: cidade.criadoEm,
                    atualizadoEm: cidade.atualizadoEm,
                })),
                total,
                limit: limit || total,
                skip: skip || 0,
            };
        }
        catch (error) {
            console.error('Erro ao listar cidades:', error.message);
            throw new Error(`Erro ao listar cidades: ${error.message}`);
        }
    }
};
exports.CidadesService = CidadesService;
exports.CidadesService = CidadesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(cidade_schema_1.Cidade.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        google_maps_service_1.GoogleMapsService])
], CidadesService);
//# sourceMappingURL=cidades.service.js.map