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
exports.CidadesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cidades_service_1 = require("./services/cidades.service");
const listar_cidades_dto_1 = require("./dto/listar-cidades.dto");
const buscar_locais_dto_1 = require("./dto/buscar-locais.dto");
const tipos_locais_enum_1 = require("./dto/tipos-locais.enum");
let CidadesController = class CidadesController {
    constructor(cidadesService) {
        this.cidadesService = cidadesService;
    }
    async obterCidades(query) {
        try {
            const raioKm = query.raioKm ? Number(query.raioKm) : null;
            if (!raioKm || isNaN(raioKm) || raioKm < 1 || raioKm > 1000) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'raioKm é obrigatório e deve ser um número entre 1 e 1000',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const endereco = query.endereco ? String(query.endereco).trim() : null;
            const lat = query.lat !== undefined ? Number(query.lat) : undefined;
            const lon = query.lon !== undefined ? Number(query.lon) : undefined;
            if (!endereco && (lat === undefined || lon === undefined)) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'É necessário fornecer coordenadas (lat e lon) OU um endereco',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (!endereco) {
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    throw new common_1.HttpException({
                        success: false,
                        message: 'lat deve ser um número entre -90 e 90',
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
                if (isNaN(lon) || lon < -180 || lon > 180) {
                    throw new common_1.HttpException({
                        success: false,
                        message: 'lon deve ser um número entre -180 e 180',
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
            }
            let latFinal;
            let lonFinal;
            let cidadeAtualPorEndereco = null;
            if (endereco) {
                const resultadoEndereco = await this.cidadesService.buscarCoordenadasPorEndereco(endereco);
                latFinal = resultadoEndereco.coordenadas.lat;
                lonFinal = resultadoEndereco.coordenadas.lon;
                cidadeAtualPorEndereco = {
                    cidade: resultadoEndereco.cidade,
                    estado: resultadoEndereco.estado,
                    pais: resultadoEndereco.pais,
                    endereco_completo: resultadoEndereco.endereco_completo,
                    coordenadas: resultadoEndereco.coordenadas,
                    doMongoDB: false,
                };
            }
            else {
                latFinal = lat;
                lonFinal = lon;
            }
            const limitNum = query.limit !== undefined && query.limit !== null
                ? (typeof query.limit === 'string' ? parseInt(query.limit, 10) : Number(query.limit))
                : undefined;
            const skipNum = query.skip !== undefined && query.skip !== null
                ? (typeof query.skip === 'string' ? parseInt(query.skip, 10) : Number(query.skip))
                : undefined;
            if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 1 || limitNum > 100)) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Limit deve ser um número entre 1 e 100',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (skipNum !== undefined && (isNaN(skipNum) || skipNum < 0)) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Skip deve ser um número maior ou igual a 0',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const [cidadeAtual, resultadoVizinhas] = await Promise.all([
                cidadeAtualPorEndereco
                    ? Promise.resolve(cidadeAtualPorEndereco)
                    : this.cidadesService.obterCidadeAtual(latFinal, lonFinal),
                this.cidadesService.obterCidadesVizinhas(latFinal, lonFinal, raioKm, limitNum, skipNum),
            ]);
            return {
                success: true,
                data: {
                    cidadeAtual: {
                        ...cidadeAtual,
                        fonte: cidadeAtual.doMongoDB ? 'MongoDB' : 'Google Maps API',
                    },
                    cidadesVizinhas: {
                        cidades: resultadoVizinhas.cidades,
                        total: resultadoVizinhas.total,
                        limit: resultadoVizinhas.limit,
                        skip: resultadoVizinhas.skip,
                        fonte: resultadoVizinhas.doMongoDB ? 'MongoDB' : 'Google Maps API',
                    },
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao buscar cidades',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async listarCidades(query) {
        try {
            const resultado = await this.cidadesService.listarTodasCidades(query.limit, query.skip);
            return {
                success: true,
                data: resultado,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao listar cidades',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async buscarLocais(query) {
        try {
            if (!query.query || !query.city) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'query e city são obrigatórios',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const locais = await this.cidadesService.buscarLocaisPorCidade(query.query, query.city);
            return {
                success: true,
                data: locais,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao buscar locais',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.CidadesController = CidadesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Busca cidade atual e cidades vizinhas',
        description: 'Retorna a cidade atual e todas as cidades vizinhas dentro do raio especificado. Pode buscar por coordenadas (lat/lon) ou por nome de cidade/endereço (endereco). É necessário fornecer coordenadas OU endereco, não ambos.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'lat',
        required: false,
        type: Number,
        description: 'Latitude da coordenada central (obrigatório se endereco não for fornecido)',
        example: -23.5178,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'lon',
        required: false,
        type: Number,
        description: 'Longitude da coordenada central (obrigatório se endereco não for fornecido)',
        example: -46.1894,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endereco',
        required: false,
        type: String,
        description: 'Nome da cidade ou endereço completo (obrigatório se lat/lon não forem fornecidos). Exemplos: "São Paulo, SP", "Rio de Janeiro, RJ", "Brasília, DF"',
        example: 'São Paulo, SP',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'raioKm',
        required: true,
        type: Number,
        description: 'Raio em quilômetros para buscar cidades vizinhas',
        example: 30,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Número máximo de cidades vizinhas para retornar (padrão: 20, máximo: 100)',
        example: 20,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: Number,
        description: 'Número de cidades vizinhas para pular na paginação (padrão: 0)',
        example: 0,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dados encontrados com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        cidadeAtual: {
                            type: 'object',
                            properties: {
                                cidade: { type: 'string', example: 'São Paulo' },
                                estado: { type: 'string', example: 'SP' },
                                pais: { type: 'string', example: 'BR' },
                                endereco_completo: { type: 'string', example: 'São Paulo, SP, Brasil' },
                                coordenadas: {
                                    type: 'object',
                                    properties: {
                                        lat: { type: 'number', example: -23.5557714 },
                                        lon: { type: 'number', example: -46.6395571 },
                                    },
                                },
                                fonte: { type: 'string', example: 'Google Maps API' },
                            },
                        },
                        cidadesVizinhas: {
                            type: 'object',
                            properties: {
                                cidades: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            nome: { type: 'string', example: 'Osasco' },
                                            estado: { type: 'string', example: 'SP' },
                                            pais: { type: 'string', example: 'BR' },
                                            distancia_km: { type: 'number', example: 18.03 },
                                            lat: { type: 'number', example: -23.5557409 },
                                            lon: { type: 'number', example: -46.8164283 },
                                        },
                                    },
                                },
                                total: { type: 'number', example: 8 },
                                limit: { type: 'number', example: 20 },
                                skip: { type: 'number', example: 0 },
                                fonte: { type: 'string', example: 'Google Maps API' },
                            },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos - é necessário fornecer coordenadas (lat e lon) OU um endereco' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "obterCidades", null);
__decorate([
    (0, common_1.Get)('listar'),
    (0, swagger_1.ApiOperation)({
        summary: 'Lista todas as cidades salvas no MongoDB',
        description: 'Retorna todas as cidades armazenadas no banco de dados com opção de paginação'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de cidades retornada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listar_cidades_dto_1.ListarCidadesDto]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "listarCidades", null);
__decorate([
    (0, common_1.Get)('locais'),
    (0, swagger_1.ApiOperation)({
        summary: 'Busca locais em uma cidade',
        description: 'Busca locais (chalés, pousadas, restaurantes, etc.) em uma cidade específica usando Google Places API'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'query',
        required: true,
        enum: tipos_locais_enum_1.TiposLocais,
        description: 'Termo de busca para o tipo de local',
        example: tipos_locais_enum_1.TiposLocais.CHALE,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'city',
        required: true,
        type: String,
        description: 'Nome da cidade onde buscar os locais',
        example: 'Campos do Jordão',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Locais encontrados com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            nome: { type: 'string', example: 'Chalé da Montanha' },
                            endereco: { type: 'string', example: 'Rua das Flores, 123, Campos do Jordão, SP' },
                            coordenadas: {
                                type: 'object',
                                properties: {
                                    lat: { type: 'number', example: -22.7394 },
                                    lon: { type: 'number', example: -45.5914 },
                                },
                            },
                            rating: { type: 'number', example: 4.5 },
                            total_avaliacoes: { type: 'number', example: 120 },
                            tipos: { type: 'array', items: { type: 'string' }, example: ['lodging', 'point_of_interest'] },
                            place_id: { type: 'string', example: 'ChIJ...' },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos - query e city são obrigatórios' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buscar_locais_dto_1.BuscarLocaisDto]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "buscarLocais", null);
exports.CidadesController = CidadesController = __decorate([
    (0, swagger_1.ApiTags)('cidades'),
    (0, common_1.Controller)('api/cidades'),
    __metadata("design:paramtypes", [cidades_service_1.CidadesService])
], CidadesController);
//# sourceMappingURL=cidades.controller.js.map