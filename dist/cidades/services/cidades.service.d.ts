import { Model } from 'mongoose';
import { Cidade, CidadeDocument } from '../schemas/cidade.schema';
import { GoogleMapsService } from './google-maps.service';
export declare class CidadesService {
    private cidadeModel;
    private googleMapsService;
    constructor(cidadeModel: Model<CidadeDocument>, googleMapsService: GoogleMapsService);
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
    salvarCidade(nome: string, estado: string, pais: string, lat: number, lon: number): Promise<import("mongoose").Document<unknown, {}, CidadeDocument, {}, import("mongoose").DefaultSchemaOptions> & Cidade & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
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
    buscarCoordenadasPorEndereco(endereco: string): Promise<{
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
    buscarLocaisPorCidade(query: string, city: string): Promise<any>;
}
