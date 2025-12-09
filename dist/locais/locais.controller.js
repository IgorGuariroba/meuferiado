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
exports.LocaisController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
const locais_service_1 = require("./services/locais.service");
const criar_local_dto_1 = require("./dto/criar-local.dto");
const atualizar_local_dto_1 = require("./dto/atualizar-local.dto");
const listar_locais_dto_1 = require("./dto/listar-locais.dto");
const local_schema_1 = require("./schemas/local.schema");
let LocaisController = class LocaisController {
    constructor(locaisService) {
        this.locaisService = locaisService;
    }
    async criar(criarLocalDto) {
        try {
            const local = await this.locaisService.criar(criarLocalDto);
            return {
                success: true,
                data: local,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao criar local',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async listar(listarLocaisDto) {
        try {
            const resultado = await this.locaisService.listar(listarLocaisDto);
            return {
                success: true,
                data: resultado,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao listar locais',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async buscarPorId(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new common_1.HttpException({
                success: false,
                message: 'ID inválido',
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const local = await this.locaisService.buscarPorId(id);
            return {
                success: true,
                data: local,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao buscar local',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async atualizar(id, atualizarLocalDto) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new common_1.HttpException({
                success: false,
                message: 'ID inválido',
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const local = await this.locaisService.atualizar(id, atualizarLocalDto);
            return {
                success: true,
                data: local,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao atualizar local',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.LocaisController = LocaisController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Criar novo local de hospedagem',
        description: 'Cria um novo local de hospedagem. Se apenas o endereço for fornecido, as coordenadas serão obtidas automaticamente via Geocoding API. O local será relacionado com uma cidade existente se encontrada próxima.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Local criado com sucesso',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        tipo: { type: 'string', example: 'casa_praia' },
                        nome: { type: 'string', example: 'Casa de Praia Encantada' },
                        descricao: { type: 'string' },
                        endereco: { type: 'string', example: 'Rua das Praias, 123, Praia Grande, SP' },
                        localizacao: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', example: 'Point' },
                                coordinates: { type: 'array', items: { type: 'number' }, example: [-46.1894, -23.5178] },
                            },
                        },
                        preco: { type: 'number', example: 500 },
                        imagens: { type: 'array', items: { type: 'string' } },
                        contato: {
                            type: 'object',
                            properties: {
                                telefone: { type: 'string' },
                                email: { type: 'string' },
                            },
                        },
                        comodidades: { type: 'array', items: { type: 'string' } },
                        avaliacao: { type: 'number', example: 4.5 },
                        cidade: { type: 'string' },
                        criadoEm: { type: 'string', format: 'date-time' },
                        atualizadoEm: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [criar_local_dto_1.CriarLocalDto]),
    __metadata("design:returntype", Promise)
], LocaisController.prototype, "criar", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar locais de hospedagem',
        description: 'Lista locais de hospedagem com filtros opcionais por tipo, preço e localização. Suporta paginação e ordenação por distância (se coordenadas fornecidas) ou por preço.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'tipo',
        required: false,
        enum: local_schema_1.TipoLocal,
        description: 'Filtrar por tipo de local',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'precoMin',
        required: false,
        type: Number,
        description: 'Preço mínimo em reais',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'precoMax',
        required: false,
        type: Number,
        description: 'Preço máximo em reais',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'lat',
        required: false,
        type: Number,
        description: 'Latitude para busca por proximidade',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'lon',
        required: false,
        type: Number,
        description: 'Longitude para busca por proximidade',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'raioKm',
        required: false,
        type: Number,
        description: 'Raio em quilômetros para busca por proximidade',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Número máximo de resultados (padrão: 20)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: Number,
        description: 'Número de resultados para pular (paginação)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de locais retornada com sucesso',
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
                                    _id: { type: 'string' },
                                    tipo: { type: 'string' },
                                    nome: { type: 'string' },
                                    descricao: { type: 'string' },
                                    endereco: { type: 'string' },
                                    localizacao: { type: 'object' },
                                    preco: { type: 'number' },
                                    imagens: { type: 'array', items: { type: 'string' } },
                                    contato: { type: 'object' },
                                    comodidades: { type: 'array', items: { type: 'string' } },
                                    avaliacao: { type: 'number' },
                                    distancia_km: { type: 'number', description: 'Presente apenas se busca por proximidade' },
                                    criadoEm: { type: 'string', format: 'date-time' },
                                    atualizadoEm: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                        total: { type: 'number', example: 50 },
                        limit: { type: 'number', example: 20 },
                        skip: { type: 'number', example: 0 },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listar_locais_dto_1.ListarLocaisDto]),
    __metadata("design:returntype", Promise)
], LocaisController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar local por ID',
        description: 'Retorna os detalhes de um local específico pelo seu ID',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID do local (MongoDB ObjectId)',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Local encontrado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Local não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LocaisController.prototype, "buscarPorId", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar local de hospedagem',
        description: 'Atualiza um local existente. Apenas os campos fornecidos serão atualizados. Se endereço ou coordenadas forem atualizados, o relacionamento com cidade será recalculado.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID do local (MongoDB ObjectId)',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Local atualizado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Local não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, atualizar_local_dto_1.AtualizarLocalDto]),
    __metadata("design:returntype", Promise)
], LocaisController.prototype, "atualizar", null);
exports.LocaisController = LocaisController = __decorate([
    (0, swagger_1.ApiTags)('locais'),
    (0, common_1.Controller)('api/locais'),
    __metadata("design:paramtypes", [locais_service_1.LocaisService])
], LocaisController);
//# sourceMappingURL=locais.controller.js.map