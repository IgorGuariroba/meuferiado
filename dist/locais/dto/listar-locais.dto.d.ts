import { TipoLocal } from '../schemas/local.schema';
export declare class ListarLocaisDto {
    tipo?: TipoLocal;
    precoMin?: number;
    precoMax?: number;
    lat?: number;
    lon?: number;
    raioKm?: number;
    limit?: number;
    skip?: number;
}
