import { TipoLocal } from '../schemas/local.schema';
export declare class ContatoDto {
    telefone?: string;
    email?: string;
}
export declare class CriarLocalDto {
    tipo: TipoLocal;
    nome: string;
    descricao?: string;
    endereco: string;
    lat?: number;
    lon?: number;
    preco: number;
    imagens?: string[];
    contato?: ContatoDto;
    comodidades?: string[];
    avaliacao?: number;
}
