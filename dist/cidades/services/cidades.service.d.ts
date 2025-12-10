import { Model, Types } from 'mongoose';
import { Cidade, CidadeDocument } from '../schemas/cidade.schema';
import { Local, LocalDocument } from '../../locais/schemas/local.schema';
import { TermoBusca, TermoBuscaDocument } from '../schemas/termo-busca.schema';
import { GoogleMapsService } from './google-maps.service';
export declare class CidadesService {
    private cidadeModel;
    private localModel;
    private termoBuscaModel;
    private googleMapsService;
    constructor(cidadeModel: Model<CidadeDocument>, localModel: Model<LocalDocument>, termoBuscaModel: Model<TermoBuscaDocument>, googleMapsService: GoogleMapsService);
    buscarCidadePorCoordenadas(lat: number, lon: number, raioKm?: number): Promise<{
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
    }>;
    buscarCidadesProximas(lat: number, lon: number, raioKm: number): Promise<{
        nome: string;
        estado: string;
        pais: string;
        distancia_km: number;
        lat: number;
        lon: number;
    }[]>;
    salvarCidade(nome: string, estado: string, pais: string, lat: number, lon: number): Promise<import("mongoose").Document<unknown, {}, CidadeDocument, {}, import("mongoose").DefaultSchemaOptions> & Cidade & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    salvarCidades(cidades: Array<{
        nome: string;
        estado: string;
        pais: string;
        lat: number;
        lon: number;
    }>): Promise<any[]>;
    buscarCoordenadasPorEndereco(endereco: string, coordenadasValidadas?: {
        lat: number;
        lon: number;
    }, raioValidacaoKm?: number): Promise<{
        doMongoDB: boolean;
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
        coordenadas: {
            lat: any;
            lon: any;
        };
    }>;
    obterCidadeAtual(lat: number, lon: number): Promise<{
        doMongoDB: boolean;
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
    } | {
        doMongoDB: boolean;
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
        coordenadas: {
            lat: number;
            lon: number;
        };
    }>;
    obterCidadesVizinhas(lat: number, lon: number, raioKm: number, limit?: number, skip?: number): Promise<{
        cidades: any[];
        total: number;
        limit: number;
        skip: number;
        doMongoDB: boolean;
    }>;
    listarTodasCidades(limit?: number, skip?: number): Promise<{
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
    }>;
    salvarLocalSeNaoExistir(localData: any, tipoQuery: string, city: string): Promise<import("mongoose").Document<unknown, {}, LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    buscarLocaisPorCidade(query: string, city: string): Promise<{
        id: any;
        tipo: any;
        nome: any;
        descricao: any;
        endereco: any;
        formatted_address: any;
        coordenadas: any;
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
        criadoEm: any;
        atualizadoEm: any;
    }[]>;
    buscarLocaisSalvosPorCidade(city: string, estado?: string, limit?: number, skip?: number, nome?: string): Promise<{
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
    }>;
    atualizarLocaisSemDetalhes(city: string, estado?: string, limit?: number): Promise<{
        atualizados: number;
        erros: number;
        locais: any[];
    }>;
    excluirLocaisSalvos(city: string, estado?: string, placeId?: string): Promise<{
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
    }>;
    gerarUrlFoto(photoReference: string, maxWidth?: number, maxHeight?: number): string;
    buscarLocaisExcluidos(city: string, estado?: string, limit?: number, skip?: number): Promise<{
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
    }>;
    listarTermosBusca(ativo?: boolean): Promise<{
        termos: (TermoBusca & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    criarTermoBusca(termo: string, descricao?: string, ativo?: boolean): Promise<import("mongoose").Document<unknown, {}, TermoBuscaDocument, {}, import("mongoose").DefaultSchemaOptions> & TermoBusca & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    excluirTermoBusca(termo: string): Promise<{
        termo: string;
        excluido: boolean;
    }>;
}
