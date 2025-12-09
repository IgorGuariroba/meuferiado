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
exports.AtualizarLocalDto = exports.AtualizarContatoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const local_schema_1 = require("../schemas/local.schema");
class AtualizarContatoDto {
}
exports.AtualizarContatoDto = AtualizarContatoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telefone de contato',
        example: '(11) 98765-4321',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AtualizarContatoDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de contato',
        example: 'contato@exemplo.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AtualizarContatoDto.prototype, "email", void 0);
class AtualizarLocalDto {
}
exports.AtualizarLocalDto = AtualizarLocalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tipo do local de hospedagem',
        enum: local_schema_1.TipoLocal,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(local_schema_1.TipoLocal),
    __metadata("design:type", String)
], AtualizarLocalDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nome do local',
        example: 'Casa de Praia Encantada',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AtualizarLocalDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descrição do local',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AtualizarLocalDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Endereço completo do local',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AtualizarLocalDto.prototype, "endereco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Latitude',
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
], AtualizarLocalDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Longitude',
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
], AtualizarLocalDto.prototype, "lon", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preço diário em reais',
        example: 500,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AtualizarLocalDto.prototype, "preco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de URLs das imagens do local',
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], AtualizarLocalDto.prototype, "imagens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informações de contato',
        type: AtualizarContatoDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => AtualizarContatoDto),
    __metadata("design:type", AtualizarContatoDto)
], AtualizarLocalDto.prototype, "contato", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lista de comodidades disponíveis',
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AtualizarLocalDto.prototype, "comodidades", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Avaliação do local (0 a 5)',
        example: 4.5,
        minimum: 0,
        maximum: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], AtualizarLocalDto.prototype, "avaliacao", void 0);
//# sourceMappingURL=atualizar-local.dto.js.map