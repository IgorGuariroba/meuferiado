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
exports.LocalSchema = exports.Local = exports.Contato = exports.TipoLocal = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var TipoLocal;
(function (TipoLocal) {
    TipoLocal["CASA_PRAIA"] = "casa_praia";
    TipoLocal["CHALE"] = "chale";
    TipoLocal["POUSADA"] = "pousada";
    TipoLocal["HOTEL_FAZENDA"] = "hotel_fazenda";
    TipoLocal["CABANA"] = "cabana";
    TipoLocal["RESORT"] = "resort";
    TipoLocal["ALUGUEL_TEMPORADA"] = "aluguel_temporada";
})(TipoLocal || (exports.TipoLocal = TipoLocal = {}));
let Contato = class Contato {
};
exports.Contato = Contato;
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Contato.prototype, "telefone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Contato.prototype, "email", void 0);
exports.Contato = Contato = __decorate([
    (0, mongoose_1.Schema)({ timestamps: false })
], Contato);
let Local = class Local {
};
exports.Local = Local;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(TipoLocal),
        required: true,
    }),
    __metadata("design:type", String)
], Local.prototype, "tipo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "nome", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "descricao", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "endereco", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    }),
    __metadata("design:type", Object)
], Local.prototype, "localizacao", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, min: 0, default: 0 }),
    __metadata("design:type", Number)
], Local.prototype, "preco", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Local.prototype, "imagens", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            telefone: String,
            email: String,
        },
        required: false,
    }),
    __metadata("design:type", Contato)
], Local.prototype, "contato", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Local.prototype, "comodidades", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, min: 0, max: 5 }),
    __metadata("design:type", Number)
], Local.prototype, "avaliacao", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Local.prototype, "tipos", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Local.prototype, "categorias", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Local.prototype, "total_avaliacoes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Cidade', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Local.prototype, "cidade", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "place_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{
                photo_reference: String,
                width: Number,
                height: Number,
            }],
        default: [],
    }),
    __metadata("design:type", Array)
], Local.prototype, "photos", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "formatted_phone_number", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "website", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Local.prototype, "opening_hours", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            weekday_descriptions: [String],
            open_now: Boolean,
            periods: [{
                    open: {
                        day: Number,
                        time: String,
                    },
                    close: {
                        day: Number,
                        time: String,
                    },
                }],
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Local.prototype, "current_opening_hours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Local.prototype, "open_now", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{
                autor: String,
                rating: Number,
                texto: String,
                data: String,
            }],
        default: [],
    }),
    __metadata("design:type", Array)
], Local.prototype, "reviews", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "formatted_address", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{
                tipo: [String],
                nome_longo: String,
                nome_curto: String,
                linguagem: String,
            }],
        default: [],
    }),
    __metadata("design:type", Array)
], Local.prototype, "address_components", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Local.prototype, "business_status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Local.prototype, "criadoEm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Local.prototype, "atualizadoEm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Local.prototype, "deletedAt", void 0);
exports.Local = Local = __decorate([
    (0, mongoose_1.Schema)({ timestamps: false })
], Local);
exports.LocalSchema = mongoose_1.SchemaFactory.createForClass(Local);
exports.LocalSchema.index({ localizacao: '2dsphere' });
exports.LocalSchema.index({ tipo: 1 });
exports.LocalSchema.index({ preco: 1 });
exports.LocalSchema.index({ cidade: 1 });
exports.LocalSchema.index({ place_id: 1 }, { unique: true, sparse: true });
exports.LocalSchema.index({ tipo: 1, localizacao: '2dsphere' });
exports.LocalSchema.index({ deletedAt: 1 });
exports.LocalSchema.index({ cidade: 1, deletedAt: 1 });
exports.LocalSchema.pre('save', async function () {
    this.atualizadoEm = new Date();
});
//# sourceMappingURL=local.schema.js.map