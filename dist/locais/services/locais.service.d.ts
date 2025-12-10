import { Model, Types } from 'mongoose';
import { Local, LocalDocument, TipoLocal } from '../schemas/local.schema';
import { CriarLocalDto } from '../dto/criar-local.dto';
import { AtualizarLocalDto } from '../dto/atualizar-local.dto';
import { ListarLocaisDto } from '../dto/listar-locais.dto';
import { GoogleMapsService } from '../../cidades/services/google-maps.service';
import { CidadesService } from '../../cidades/services/cidades.service';
import { CidadeDocument } from '../../cidades/schemas/cidade.schema';
export declare class LocaisService {
    private localModel;
    private cidadeModel;
    private googleMapsService;
    private cidadesService;
    constructor(localModel: Model<LocalDocument>, cidadeModel: Model<CidadeDocument>, googleMapsService: GoogleMapsService, cidadesService: CidadesService);
    criar(criarLocalDto: CriarLocalDto): Promise<import("mongoose").Document<unknown, {}, LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    listar(listarLocaisDto: ListarLocaisDto): Promise<{
        locais: any[];
        total: number;
        limit: number;
        skip: number;
    }>;
    buscarPorId(id: string): Promise<import("mongoose").Document<unknown, {}, LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    atualizar(id: string, atualizarLocalDto: AtualizarLocalDto): Promise<import("mongoose").Document<unknown, {}, LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    buscarProximos(lat: number, lon: number, raioKm: number, limit?: number): Promise<{
        distancia_km: number;
        tipo: TipoLocal;
        nome: string;
        descricao?: string;
        endereco: string;
        localizacao: {
            type: "Point";
            coordinates: [number, number];
        };
        preco?: number;
        imagens: string[];
        contato?: import("../schemas/local.schema").Contato;
        comodidades: string[];
        avaliacao?: number;
        tipos?: string[];
        categorias?: string[];
        total_avaliacoes?: number;
        cidade?: Types.ObjectId;
        place_id?: string;
        photos?: Array<{
            photo_reference?: string;
            width?: number;
            height?: number;
        }>;
        formatted_phone_number?: string;
        website?: string;
        url?: string;
        opening_hours?: string[];
        current_opening_hours?: {
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
        open_now?: boolean;
        reviews?: Array<{
            autor?: string;
            rating?: number;
            texto?: string;
            data?: string;
        }>;
        formatted_address?: string;
        address_components?: Array<{
            tipo?: string[];
            nome_longo?: string;
            nome_curto?: string;
            linguagem?: string;
        }>;
        business_status?: string;
        criadoEm: Date;
        atualizadoEm: Date;
        deletedAt?: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }[]>;
}
