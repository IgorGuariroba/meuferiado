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
const buscar_locais_salvos_dto_1 = require("./dto/buscar-locais-salvos.dto");
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
    async buscarLocaisSalvos(query) {
        try {
            if (!query.city) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'city é obrigatório',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const limit = query.limit ? Math.min(Math.max(1, query.limit), 100) : 50;
            const skip = query.skip ? Math.max(0, query.skip) : 0;
            const resultado = await this.cidadesService.buscarLocaisSalvosPorCidade(query.city, query.estado, limit, skip);
            return {
                success: true,
                data: resultado,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao buscar locais salvos',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async atualizarLocaisSemDetalhes(city, estado, limit) {
        try {
            if (!city) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'city é obrigatório',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const limitNum = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 20) : 10;
            const resultado = await this.cidadesService.atualizarLocaisSemDetalhes(city, estado, limitNum);
            return {
                success: true,
                data: resultado,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao atualizar locais',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async excluirLocaisSalvos(city, estado, placeId) {
        try {
            if (!city) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'city é obrigatório',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const resultado = await this.cidadesService.excluirLocaisSalvos(city, estado, placeId);
            return {
                success: true,
                data: resultado,
            };
        }
        catch (error) {
            const statusCode = error.message.includes('não encontrado')
                ? common_1.HttpStatus.NOT_FOUND
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao excluir locais',
            }, statusCode);
        }
    }
    async gerarUrlFoto(photoReference, maxWidth, maxHeight) {
        try {
            if (!photoReference) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'photo_reference é obrigatório',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const width = maxWidth ? parseInt(maxWidth, 10) : 800;
            const height = maxHeight ? parseInt(maxHeight, 10) : 600;
            const url = this.cidadesService.gerarUrlFoto(photoReference, width, height);
            if (!url) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Não foi possível gerar a URL da foto. Verifique se o photo_reference está no formato correto.',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            return {
                success: true,
                data: {
                    url,
                    photo_reference: photoReference,
                    maxWidth: width,
                    maxHeight: height,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao gerar URL da foto',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
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
        example: 'Mogi das Cruzes',
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
                            nome: { type: 'string', example: 'Chalé Conforto' },
                            endereco: { type: 'string', example: 'Estr. Manoel Ferreira, s/n - Manoel Ferreira, Mogi das Cruzes - SP, 08700-000, Brasil' },
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
__decorate([
    (0, common_1.Get)('locais-salvos'),
    (0, swagger_1.ApiOperation)({
        summary: 'Busca locais salvos no MongoDB por cidade',
        description: 'Retorna todos os locais salvos no banco de dados para uma cidade específica. Busca apenas no MongoDB, não faz requisições à API do Google.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'city',
        required: true,
        type: String,
        description: 'Nome da cidade para buscar os locais salvos',
        example: 'Mogi das Cruzes',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'estado',
        required: false,
        type: String,
        description: 'Estado da cidade (opcional, ajuda a identificar a cidade corretamente)',
        example: 'SP',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Número máximo de locais para retornar (padrão: 50, máximo: 100)',
        example: 50,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: Number,
        description: 'Número de locais para pular na paginação (padrão: 0)',
        example: 0,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Locais salvos encontrados com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        locais: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '69385d67345b652f14567483' },
                                    tipo: { type: 'string', example: 'chale' },
                                    nome: { type: 'string', example: 'Chalé Conforto' },
                                    descricao: { type: 'string', example: 'Local encontrado em Mogi das Cruzes' },
                                    endereco: { type: 'string', example: 'Estr. Manoel Ferreira, s/n - Manoel Ferreira, Mogi das Cruzes - SP' },
                                    formatted_address: { type: 'string', example: 'Estr. Manoel Ferreira, s/n - Manoel Ferreira, Mogi das Cruzes - SP, 08700-000, Brazil' },
                                    coordenadas: {
                                        type: 'object',
                                        properties: {
                                            lat: { type: 'number', example: -23.675528 },
                                            lon: { type: 'number', example: -46.094111 },
                                        },
                                    },
                                    preco: { type: 'number', example: 150 },
                                    avaliacao: { type: 'number', example: 4.8 },
                                    place_id: { type: 'string', example: 'ChIJ8_PWhVjmzZQRwVSFsm_xXiM' },
                                    photos: { type: 'array', items: { type: 'object' } },
                                    formatted_phone_number: { type: 'string', example: '(11) 94259-4723' },
                                    website: { type: 'string', example: 'https://chaleconforto.wixsite.com/chale' },
                                    url: { type: 'string', example: 'https://maps.google.com/?cid=...' },
                                    opening_hours: { type: 'array', items: { type: 'string' } },
                                    current_opening_hours: { type: 'object' },
                                    open_now: { type: 'boolean', example: false },
                                    reviews: { type: 'array', items: { type: 'object' } },
                                    address_components: { type: 'array', items: { type: 'object' } },
                                    business_status: { type: 'string', example: 'OPERATIONAL' },
                                    criadoEm: { type: 'string', example: '2025-12-09T17:33:27.000Z' },
                                    atualizadoEm: { type: 'string', example: '2025-12-09T18:01:21.000Z' },
                                },
                            },
                        },
                        total: { type: 'number', example: 2 },
                        cidade: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: '69385d67345b652f145674a5' },
                                nome: { type: 'string', example: 'Mogi das Cruzes' },
                                estado: { type: 'string', example: 'SP' },
                                pais: { type: 'string', example: 'BR' },
                            },
                        },
                        limit: { type: 'number', example: 50 },
                        skip: { type: 'number', example: 0 },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos - city é obrigatório' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buscar_locais_salvos_dto_1.BuscarLocaisSalvosDto]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "buscarLocaisSalvos", null);
__decorate([
    (0, common_1.Get)('locais-salvos/atualizar'),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualiza locais salvos que não têm detalhes completos',
        description: 'Busca e atualiza locais existentes no MongoDB que não têm photos, reviews, telefone ou website. Útil para atualizar locais salvos antes da implementação dos detalhes completos.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'city',
        required: true,
        type: String,
        description: 'Nome da cidade',
        example: 'Mogi das Cruzes',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'estado',
        required: false,
        type: String,
        description: 'Estado da cidade',
        example: 'SP',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Número máximo de locais para atualizar (padrão: 10)',
        example: 10,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Locais atualizados com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        atualizados: { type: 'number', example: 2 },
                        erros: { type: 'number', example: 0 },
                        locais: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    nome: { type: 'string' },
                                    place_id: { type: 'string' },
                                    atualizado: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "atualizarLocaisSemDetalhes", null);
__decorate([
    (0, common_1.Delete)('locais-salvos'),
    (0, swagger_1.ApiOperation)({
        summary: 'Exclui locais salvos no MongoDB',
        description: 'Exclui locais salvos de uma cidade. Pode excluir todos os locais da cidade ou um local específico por place_id.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'city',
        required: true,
        type: String,
        description: 'Nome da cidade',
        example: 'Mogi das Cruzes',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'estado',
        required: false,
        type: String,
        description: 'Estado da cidade (opcional, ajuda a identificar a cidade corretamente)',
        example: 'SP',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'place_id',
        required: false,
        type: String,
        description: 'Place ID do local específico a ser excluído (opcional). Se não fornecido, exclui todos os locais da cidade.',
        example: 'ChIJ8_PWhVjmzZQRwVSFsm_xXiM',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Locais excluídos com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        excluidos: { type: 'number', example: 2 },
                        cidade: {
                            type: 'object',
                            properties: {
                                nome: { type: 'string', example: 'Mogi das Cruzes' },
                                estado: { type: 'string', example: 'SP' },
                                pais: { type: 'string', example: 'BR' },
                            },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Local específico excluído com sucesso (quando place_id é fornecido)',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        excluidos: { type: 'number', example: 1 },
                        local: {
                            type: 'object',
                            properties: {
                                nome: { type: 'string', example: 'Chalé Conforto' },
                                place_id: { type: 'string', example: 'ChIJ8_PWhVjmzZQRwVSFsm_xXiM' },
                            },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos - city é obrigatório' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cidade ou local não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('place_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "excluirLocaisSalvos", null);
__decorate([
    (0, common_1.Get)('foto'),
    (0, swagger_1.ApiOperation)({
        summary: 'Gera URL para visualizar foto do Google Places',
        description: 'Retorna a URL direta para visualizar uma foto usando o photo_reference retornado pela API.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'photo_reference',
        required: true,
        type: String,
        description: 'O photo_reference completo retornado pela API (ex: "places/ChIJ.../photos/...")',
        example: 'places/ChIJ8_PWhVjmzZQRwVSFsm_xXiM/photos/AZLasHotBrxY5xDRjB3wsmCCzCTOX1Oh74u_PBt9QiUV8MCEOqQZRgAMI40ehGofV5emAJ6IDt7mR-YH3-7dc13jp-p-wOi6MQmczqb-p-mKLYl1JUHx23qGqR4I3uNCUpgaN3KoOiuu8gij2zO3W6raTB7y6A1W_JvrEfflF4-StlSEsIg5dQysyJhvLSFcn7JiuhPch-BR6RIbiSigvXYBVbBFxlfrc4Ob5Xqn3w8XVFwzAcRDyWChby9-C5PNIAwuMToecR1457_vyZHU0S4au60_YgneTdBR7TIM2yfyaMG-zWVJwrEV9JudY5Z2vzNdaEyv38eGvijXpj71CDV_t_wbC8SdmTJtOwMY7LEyT5s5eE15xGlur5plfENkEuLVp92wtlbDNsIAOcflAi_RssAFq2CFuGPBxdiC_GwUjxc',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'maxWidth',
        required: false,
        type: Number,
        description: 'Largura máxima da imagem em pixels (padrão: 800)',
        example: 800,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'maxHeight',
        required: false,
        type: Number,
        description: 'Altura máxima da imagem em pixels (padrão: 600)',
        example: 600,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'URL da foto gerada com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            example: 'https://places.googleapis.com/v1/places/ChIJ8_PWhVjmzZQRwVSFsm_xXiM/photos/AZLasHotBrxY5xDRjB3wsmCCzCTOX1Oh74u_PBt9QiUV8MCEOqQZRgAMI40ehGofV5emAJ6IDt7mR-YH3-7dc13jp-p-wOi6MQmczqb-p-mKLYl1JUHx23qGqR4I3uNCUpgaN3KoOiuu8gij2zO3W6raTB7y6A1W_JvrEfflF4-StlSEsIg5dQysyJhvLSFcn7JiuhPch-BR6RIbiSigvXYBVbBFxlfrc4Ob5Xqn3w8XVFwzAcRDyWChby9-C5PNIAwuMToecR1457_vyZHU0S4au60_YgneTdBR7TIM2yfyaMG-zWVJwrEV9JudY5Z2vzNdaEyv38eGvijXpj71CDV_t_wbC8SdmTJtOwMY7LEyT5s5eE15xGlur5plfENkEuLVp92wtlbDNsIAOcflAi_RssAFq2CFuGPBxdiC_GwUjxc/media?maxHeightPx=600&maxWidthPx=800&key=YOUR_API_KEY'
                        },
                        photo_reference: { type: 'string' },
                        maxWidth: { type: 'number', example: 800 },
                        maxHeight: { type: 'number', example: 600 },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'photo_reference é obrigatório' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)('photo_reference')),
    __param(1, (0, common_1.Query)('maxWidth')),
    __param(2, (0, common_1.Query)('maxHeight')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "gerarUrlFoto", null);
exports.CidadesController = CidadesController = __decorate([
    (0, swagger_1.ApiTags)('cidades'),
    (0, common_1.Controller)('api/cidades'),
    __metadata("design:paramtypes", [cidades_service_1.CidadesService])
], CidadesController);
//# sourceMappingURL=cidades.controller.js.map