"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapearTipoLocal = mapearTipoLocal;
exports.estimarPrecoPorPriceLevel = estimarPrecoPorPriceLevel;
const local_schema_1 = require("../../locais/schemas/local.schema");
const tipos_locais_enum_1 = require("../dto/tipos-locais.enum");
function mapearTipoLocal(tipoQuery) {
    const mapeamento = {
        [tipos_locais_enum_1.TiposLocais.CHALE]: local_schema_1.TipoLocal.CHALE,
        [tipos_locais_enum_1.TiposLocais.CABANA]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.POUSADA]: local_schema_1.TipoLocal.POUSADA,
        [tipos_locais_enum_1.TiposLocais.HOTEL_FAZENDA]: local_schema_1.TipoLocal.HOTEL_FAZENDA,
        [tipos_locais_enum_1.TiposLocais.RESORT]: local_schema_1.TipoLocal.RESORT,
        [tipos_locais_enum_1.TiposLocais.CASA_PRAIA]: local_schema_1.TipoLocal.CASA_PRAIA,
        [tipos_locais_enum_1.TiposLocais.CASA_TEMPORADA]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.APARTAMENTO_TEMPORADA]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.CASA_VERANEIO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.BEACH_HOUSE]: local_schema_1.TipoLocal.CASA_PRAIA,
        [tipos_locais_enum_1.TiposLocais.CASA_BEIRA_MAR]: local_schema_1.TipoLocal.CASA_PRAIA,
        [tipos_locais_enum_1.TiposLocais.CASA_LAGO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.ILHA_PARTICULAR]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.APART_HOTEL]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.FLAT]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.CONDOMINIO_FECHADO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.VILLA]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.SOBRADO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.HOSTEL]: local_schema_1.TipoLocal.POUSADA,
        [tipos_locais_enum_1.TiposLocais.ALBERGUE]: local_schema_1.TipoLocal.POUSADA,
        [tipos_locais_enum_1.TiposLocais.CASA_COMPARTILHADA]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.LODGE]: local_schema_1.TipoLocal.POUSADA,
        [tipos_locais_enum_1.TiposLocais.ESTALAGEM]: local_schema_1.TipoLocal.POUSADA,
        [tipos_locais_enum_1.TiposLocais.GUEST_HOUSE]: local_schema_1.TipoLocal.POUSADA,
        [tipos_locais_enum_1.TiposLocais.CASA_CAMPO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.CASA_RURAL]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.RETIRO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.ECOVILA]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.ECO_RESORT]: local_schema_1.TipoLocal.RESORT,
        [tipos_locais_enum_1.TiposLocais.COMPLEXO_TURISTICO]: local_schema_1.TipoLocal.RESORT,
        [tipos_locais_enum_1.TiposLocais.MARINA]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.PORTO_TURISTICO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.BANGALO]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.CASA_ARVORE]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.GLAMPING]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.CAMPING]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.REFUGIO]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.RANCHO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.SITIO]: local_schema_1.TipoLocal.ALUGUEL_TEMPORADA,
        [tipos_locais_enum_1.TiposLocais.FAZENDA]: local_schema_1.TipoLocal.HOTEL_FAZENDA,
        [tipos_locais_enum_1.TiposLocais.CAMPING_SELVAGEM]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.REFUGIO_MONTANHA]: local_schema_1.TipoLocal.CABANA,
        [tipos_locais_enum_1.TiposLocais.ABRIGO_MONTANHA]: local_schema_1.TipoLocal.CABANA,
    };
    return mapeamento[tipoQuery] || local_schema_1.TipoLocal.ALUGUEL_TEMPORADA;
}
function estimarPrecoPorPriceLevel(priceLevel) {
    if (priceLevel === null || priceLevel === undefined) {
        return 0;
    }
    const nivel = typeof priceLevel === 'string' ? parseInt(priceLevel) : priceLevel;
    const precosEstimados = {
        0: 0,
        1: 100,
        2: 250,
        3: 600,
        4: 1200,
    };
    return precosEstimados[nivel] || 0;
}
//# sourceMappingURL=mapear-tipo-local.util.js.map