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
const buscar_cidades_dto_1 = require("./dto/buscar-cidades.dto");
const listar_cidades_dto_1 = require("./dto/listar-cidades.dto");
let CidadesController = class CidadesController {
    constructor(cidadesService) {
        this.cidadesService = cidadesService;
    }
    async obterCidades(query) {
        try {
            const { lat, lon, raioKm } = query;
            const limitNum = query.limit !== undefined && query.limit !== null
                ? (typeof query.limit === 'string' ? parseInt(query.limit, 10) : query.limit)
                : undefined;
            const skipNum = query.skip !== undefined && query.skip !== null
                ? (typeof query.skip === 'string' ? parseInt(query.skip, 10) : query.skip)
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
                this.cidadesService.obterCidadeAtual(lat, lon),
                this.cidadesService.obterCidadesVizinhas(lat, lon, raioKm, limitNum, skipNum),
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
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
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
};
exports.CidadesController = CidadesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Busca cidade atual e cidades vizinhas',
        description: 'Retorna a cidade atual para as coordenadas fornecidas e todas as cidades vizinhas dentro do raio especificado'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados encontrados com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parâmetros inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor' }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buscar_cidades_dto_1.BuscarCidadesDto]),
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
exports.CidadesController = CidadesController = __decorate([
    (0, swagger_1.ApiTags)('cidades'),
    (0, common_1.Controller)('api/cidades'),
    __metadata("design:paramtypes", [cidades_service_1.CidadesService])
], CidadesController);
//# sourceMappingURL=cidades.controller.js.map