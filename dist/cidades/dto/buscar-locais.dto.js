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
exports.BuscarLocaisDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const tipos_locais_enum_1 = require("./tipos-locais.enum");
class BuscarLocaisDto {
}
exports.BuscarLocaisDto = BuscarLocaisDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Termo de busca para o tipo de local',
        enum: tipos_locais_enum_1.TiposLocais,
        example: tipos_locais_enum_1.TiposLocais.CHALE,
    }),
    (0, class_validator_1.IsEnum)(tipos_locais_enum_1.TiposLocais),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BuscarLocaisDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da cidade onde buscar os locais',
        example: 'Mogi das Cruzes',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BuscarLocaisDto.prototype, "city", void 0);
//# sourceMappingURL=buscar-locais.dto.js.map