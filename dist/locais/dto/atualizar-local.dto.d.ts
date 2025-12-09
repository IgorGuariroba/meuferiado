import { TipoLocal } from '../schemas/local.schema';
export declare class AtualizarContatoDto {
    telefone?: string;
    email?: string;
}
export declare class AtualizarLocalDto {
    tipo?: TipoLocal;
    nome?: string;
    descricao?: string;
    endereco?: string;
    lat?: number;
    lon?: number;
    preco?: number;
    imagens?: string[];
    contato?: AtualizarContatoDto;
    comodidades?: string[];
    avaliacao?: number;
}
