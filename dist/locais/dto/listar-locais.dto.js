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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListarLocaisDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const local_schema_1 = require("../schemas/local.schema");
class ListarLocaisDto {
}
exports.ListarLocaisDto = ListarLocaisDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrar por tipo de local',
        enum: local_schema_1.TipoLocal,
        example: local_schema_1.TipoLocal.CASA_PRAIA,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(local_schema_1.TipoLocal),
    __metadata("design:type", String)
], ListarLocaisDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preço mínimo em reais',
        example: 200,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "precoMin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preço máximo em reais',
        example: 1000,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "precoMax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Latitude para busca por proximidade',
        example: -23.5178,
        minimum: -90,
        maximum: 90,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Longitude para busca por proximidade',
        example: -46.1894,
        minimum: -180,
        maximum: 180,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "lon", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raio em quilômetros para busca por proximidade (obrigatório se lat/lon fornecidos)',
        example: 30,
        minimum: 1,
        maximum: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "raioKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número máximo de resultados para retornar',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número de resultados para pular (paginação)',
        example: 0,
        minimum: 0,
        default: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ListarLocaisDto.prototype, "skip", void 0);
//# sourceMappingURL=listar-locais.dto.js.map