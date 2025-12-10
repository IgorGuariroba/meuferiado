import { CidadesService } from './services/cidades.service';
import { ListarCidadesDto } from './dto/listar-cidades.dto';
import { BuscarLocaisDto } from './dto/buscar-locais.dto';
import { BuscarLocaisSalvosDto } from './dto/buscar-locais-salvos.dto';
import { CriarTermoBuscaDto } from './dto/criar-termo-busca.dto';
export declare class CidadesController {
    private readonly cidadesService;
    constructor(cidadesService: CidadesService);
    obterCidades(query: any): Promise<{
        success: boolean;
        data: {
            cidadeAtual: any;
            cidadesVizinhas: {
                cidades: any[];
                total: number;
                limit: number;
                skip: number;
                fonte: string;
            };
        };
    }>;
    listarCidades(query: ListarCidadesDto): Promise<{
        success: boolean;
        data: {
            cidades: {
                nome: string;
                estado: string;
                pais: string;
                lat: number;
                lon: number;
                criadoEm: Date;
                atualizadoEm: Date;
            }[];
            total: number;
            limit: number;
            skip: number;
        };
    }>;
    buscarLocais(query: BuscarLocaisDto): Promise<any>;
    buscarLocaisSalvos(query: BuscarLocaisSalvosDto): Promise<{
        success: boolean;
        data: {
            locais: {
                nome: string;
                endereco: string;
                coordenadas: {
                    lat: number;
                    lon: number;
                };
                rating: number;
                total_avaliacoes: number;
                tipos: string[];
                categorias: string[];
                place_id: string;
                nivel_preco: number;
                photos: {
                    photo_reference?: string;
                    width?: number;
                    height?: number;
                }[];
                formatted_phone_number: string;
                website: string;
                url: string;
                opening_hours: string[];
                current_opening_hours: {
                    weekday_descriptions?: string[];
                    open_now?: boolean;
                    periods?: Array<{
                        open?: {
                            day?: number;
                            time?: string;
                        };
                        close?: {
                            day?: number;
                            time?: string;
                        };
                    }>;
                };
                open_now: boolean;
                reviews: {
                    autor?: string;
                    rating?: number;
                    texto?: string;
                    data?: string;
                }[];
                formatted_address: string;
                address_components: {
                    tipo?: string[];
                    nome_longo?: string;
                    nome_curto?: string;
                    linguagem?: string;
                }[];
                business_status: string;
            }[];
            total: number;
            cidade: {
                id: string;
                nome: string;
                estado: string;
                pais: string;
            };
            limit: number;
            skip: number;
        };
    }>;
    atualizarLocaisSemDetalhes(city: string, estado?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            atualizados: number;
            erros: number;
            locais: any[];
        };
    }>;
    excluirLocaisSalvos(city: string, estado?: string, placeId?: string): Promise<{
        success: boolean;
        data: {
            excluidos: number;
            local: {
                nome: string;
                place_id: string;
                deletedAt: Date;
            };
            cidade?: undefined;
        } | {
            excluidos: number;
            cidade: {
                nome: string;
                estado: string;
                pais: string;
            };
            local?: undefined;
        };
    }>;
    restaurarLocaisSalvos(city: string, estado?: string, placeId?: string): Promise<{
        success: boolean;
        data: {
            restaurados: number;
            local: {
                nome: string;
                place_id: string;
            };
            cidade?: undefined;
        } | {
            restaurados: number;
            cidade: {
                nome: string;
                estado: string;
                pais: string;
            };
            local?: undefined;
        };
    }>;
    gerarUrlFoto(photoReference: string, maxWidth?: string, maxHeight?: string): Promise<{
        success: boolean;
        data: {
            url: string;
            photo_reference: string;
            maxWidth: number;
            maxHeight: number;
        };
    }>;
    buscarLocaisExcluidos(query: BuscarLocaisSalvosDto): Promise<{
        success: boolean;
        data: {
            locais: {
                id: any;
                tipo: any;
                nome: any;
                descricao: any;
                endereco: any;
                formatted_address: any;
                coordenadas: {
                    lat: any;
                    lon: any;
                };
                preco: any;
                avaliacao: any;
                place_id: any;
                photos: any;
                formatted_phone_number: any;
                website: any;
                url: any;
                opening_hours: any;
                current_opening_hours: any;
                open_now: any;
                reviews: any;
                address_components: any;
                business_status: any;
                deletedAt: any;
                criadoEm: any;
                atualizadoEm: any;
            }[];
            total: number;
            cidade: {
                id: string;
                nome: string;
                estado: string;
                pais: string;
            };
            limit: number;
            skip: number;
        };
    }>;
    listarTermosBusca(ativo?: string): Promise<{
        success: boolean;
        data: {
            termos: (import("./schemas/termo-busca.schema").TermoBusca & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            })[];
            total: number;
        };
    }>;
    criarTermoBusca(criarTermoBuscaDto: CriarTermoBuscaDto): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, import("./schemas/termo-busca.schema").TermoBuscaDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/termo-busca.schema").TermoBusca & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    excluirTermoBusca(termo: string): Promise<{
        success: boolean;
        data: {
            termo: string;
            excluido: boolean;
        };
    }>;
}
