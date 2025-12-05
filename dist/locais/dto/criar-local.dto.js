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
exports.CriarLocalDto = exports.ContatoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const local_schema_1 = require("../schemas/local.schema");
class ContatoDto {
}
exports.ContatoDto = ContatoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telefone de contato',
        example: '(11) 98765-4321',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContatoDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de contato',
        example: 'contato@exemplo.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ContatoDto.prototype, "email", void 0);
class CriarLocalDto {
}
exports.CriarLocalDto = CriarLocalDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo do local de hospedagem',
        enum: local_schema_1.TipoLocal,
        example: local_schema_1.TipoLocal.CASA_PRAIA,
    }),
    (0, class_validator_1.IsEnum)(local_schema_1.TipoLocal),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CriarLocalDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do local',
        example: 'Casa de Praia Encantada',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CriarLocalDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descrição do local',
        example: 'Linda casa de praia com vista para o mar, 3 quartos, piscina e área de lazer completa',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CriarLocalDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Endereço completo do local',
        example: 'Rua das Praias, 123, Praia Grande, SP',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CriarLocalDto.prototype, "endereco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Latitude (obrigatório se endereco não for fornecido ou para precisão)',
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
], CriarLocalDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Longitude (obrigatório se endereco não for fornecido ou para precisão)',
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
], CriarLocalDto.prototype, "lon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço diário em reais',
        example: 500,
        minimum: 0,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CriarLocalDto.prototype, "preco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de URLs das imagens do local',
        example: ['https://exemplo.com/imagem1.jpg', 'https://exemplo.com/imagem2.jpg'],
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], CriarLocalDto.prototype, "imagens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informações de contato',
        type: ContatoDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => ContatoDto),
    __metadata("design:type", ContatoDto)
], CriarLocalDto.prototype, "contato", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lista de comodidades disponíveis',
        example: ['piscina', 'wifi', 'ar_condicionado', 'churrasqueira'],
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CriarLocalDto.prototype, "comodidades", void 0);
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
], CriarLocalDto.prototype, "avaliacao", void 0);
//# sourceMappingURL=criar-local.dto.js.map