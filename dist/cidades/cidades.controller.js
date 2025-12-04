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
const cidades_service_1 = require("./services/cidades.service");
const buscar_cidades_dto_1 = require("./dto/buscar-cidades.dto");
const buscar_cidade_atual_dto_1 = require("./dto/buscar-cidade-atual.dto");
let CidadesController = class CidadesController {
    constructor(cidadesService) {
        this.cidadesService = cidadesService;
    }
    async obterCidadeAtual(query) {
        try {
            const { lat, lon } = query;
            const cidade = await this.cidadesService.obterCidadeAtual(lat, lon);
            return {
                success: true,
                data: cidade,
                fonte: cidade.doMongoDB ? 'MongoDB' : 'Google Maps API',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao buscar cidade atual',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async obterCidadesVizinhas(query) {
        try {
            const { lat, lon, raioKm } = query;
            const resultado = await this.cidadesService.obterCidadesVizinhas(lat, lon, raioKm);
            return {
                success: true,
                data: resultado.cidades,
                total: resultado.cidades.length,
                fonte: resultado.doMongoDB ? 'MongoDB' : 'Google Maps API',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Erro ao buscar cidades vizinhas',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.CidadesController = CidadesController;
__decorate([
    (0, common_1.Get)('atual'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buscar_cidade_atual_dto_1.BuscarCidadeAtualDto]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "obterCidadeAtual", null);
__decorate([
    (0, common_1.Get)('vizinhas'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buscar_cidades_dto_1.BuscarCidadesDto]),
    __metadata("design:returntype", Promise)
], CidadesController.prototype, "obterCidadesVizinhas", null);
exports.CidadesController = CidadesController = __decorate([
    (0, common_1.Controller)('api/cidades'),
    __metadata("design:paramtypes", [cidades_service_1.CidadesService])
], CidadesController);
//# sourceMappingURL=cidades.controller.js.map