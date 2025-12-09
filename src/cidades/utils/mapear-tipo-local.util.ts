import { TipoLocal } from '../../locais/schemas/local.schema';
import { TiposLocais } from '../dto/tipos-locais.enum';

/**
 * Mapeia o tipo de local da query para o enum TipoLocal do schema
 */
export function mapearTipoLocal(tipoQuery: string): TipoLocal {
  const mapeamento: Record<string, TipoLocal> = {
    [TiposLocais.CHALE]: TipoLocal.CHALE,
    [TiposLocais.CABANA]: TipoLocal.CABANA,
    [TiposLocais.POUSADA]: TipoLocal.POUSADA,
    [TiposLocais.HOTEL_FAZENDA]: TipoLocal.HOTEL_FAZENDA,
    [TiposLocais.RESORT]: TipoLocal.RESORT,
    [TiposLocais.CASA_PRAIA]: TipoLocal.CASA_PRAIA,
    [TiposLocais.CASA_TEMPORADA]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.APARTAMENTO_TEMPORADA]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.CASA_VERANEIO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.BEACH_HOUSE]: TipoLocal.CASA_PRAIA,
    [TiposLocais.CASA_BEIRA_MAR]: TipoLocal.CASA_PRAIA,
    [TiposLocais.CASA_LAGO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.ILHA_PARTICULAR]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.APART_HOTEL]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.FLAT]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.CONDOMINIO_FECHADO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.VILLA]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.SOBRADO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.HOSTEL]: TipoLocal.POUSADA,
    [TiposLocais.ALBERGUE]: TipoLocal.POUSADA,
    [TiposLocais.CASA_COMPARTILHADA]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.LODGE]: TipoLocal.POUSADA,
    [TiposLocais.ESTALAGEM]: TipoLocal.POUSADA,
    [TiposLocais.GUEST_HOUSE]: TipoLocal.POUSADA,
    [TiposLocais.CASA_CAMPO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.CASA_RURAL]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.RETIRO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.ECOVILA]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.ECO_RESORT]: TipoLocal.RESORT,
    [TiposLocais.COMPLEXO_TURISTICO]: TipoLocal.RESORT,
    [TiposLocais.MARINA]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.PORTO_TURISTICO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.BANGALO]: TipoLocal.CABANA,
    [TiposLocais.CASA_ARVORE]: TipoLocal.CABANA,
    [TiposLocais.GLAMPING]: TipoLocal.CABANA,
    [TiposLocais.CAMPING]: TipoLocal.CABANA,
    [TiposLocais.REFUGIO]: TipoLocal.CABANA,
    [TiposLocais.RANCHO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.SITIO]: TipoLocal.ALUGUEL_TEMPORADA,
    [TiposLocais.FAZENDA]: TipoLocal.HOTEL_FAZENDA,
    [TiposLocais.CAMPING_SELVAGEM]: TipoLocal.CABANA,
    [TiposLocais.REFUGIO_MONTANHA]: TipoLocal.CABANA,
    [TiposLocais.ABRIGO_MONTANHA]: TipoLocal.CABANA,
  };

  // Retorna o tipo mapeado ou um padrão (ALUGUEL_TEMPORADA) se não encontrar
  return mapeamento[tipoQuery] || TipoLocal.ALUGUEL_TEMPORADA;
}

/**
 * Estima o preço baseado no priceLevel do Google Places
 * priceLevel: 0 = grátis, 1 = barato, 2 = moderado, 3 = caro, 4 = muito caro
 */
export function estimarPrecoPorPriceLevel(priceLevel?: string | number | null): number {
  if (priceLevel === null || priceLevel === undefined) {
    return 0; // Preço não informado
  }

  const nivel = typeof priceLevel === 'string' ? parseInt(priceLevel) : priceLevel;

  // Estimativas em reais por noite
  const precosEstimados = {
    0: 0,      // Grátis
    1: 100,    // Barato (até R$ 100)
    2: 250,    // Moderado (R$ 100-400)
    3: 600,    // Caro (R$ 400-800)
    4: 1200,   // Muito caro (acima de R$ 800)
  };

  return precosEstimados[nivel as keyof typeof precosEstimados] || 0;
}

