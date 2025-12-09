import { Document, Types } from 'mongoose';
export type LocalDocument = Local & Document;
export declare enum TipoLocal {
    CASA_PRAIA = "casa_praia",
    CHALE = "chale",
    POUSADA = "pousada",
    HOTEL_FAZENDA = "hotel_fazenda",
    CABANA = "cabana",
    RESORT = "resort",
    ALUGUEL_TEMPORADA = "aluguel_temporada"
}
export declare class Contato {
    telefone?: string;
    email?: string;
}
export declare class Local {
    tipo: TipoLocal;
    nome: string;
    descricao?: string;
    endereco: string;
    localizacao: {
        type: 'Point';
        coordinates: [number, number];
    };
    preco?: number;
    imagens: string[];
    contato?: Contato;
    comodidades: string[];
    avaliacao?: number;
    tipos?: string[];
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
}
export declare const LocalSchema: import("mongoose").Schema<Local, import("mongoose").Model<Local, any, any, any, Document<unknown, any, Local, any, import("mongoose").DefaultSchemaOptions> & Local & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any, Local>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Local, Document<unknown, {}, Local, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    tipo?: import("mongoose").SchemaDefinitionProperty<TipoLocal, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    nome?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    descricao?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    endereco?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    localizacao?: import("mongoose").SchemaDefinitionProperty<{
        type: "Point";
        coordinates: [number, number];
    }, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    preco?: import("mongoose").SchemaDefinitionProperty<number, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    imagens?: import("mongoose").SchemaDefinitionProperty<string[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    contato?: import("mongoose").SchemaDefinitionProperty<Contato, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    comodidades?: import("mongoose").SchemaDefinitionProperty<string[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    avaliacao?: import("mongoose").SchemaDefinitionProperty<number, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    tipos?: import("mongoose").SchemaDefinitionProperty<string[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    total_avaliacoes?: import("mongoose").SchemaDefinitionProperty<number, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    cidade?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    place_id?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    photos?: import("mongoose").SchemaDefinitionProperty<{
        photo_reference?: string;
        width?: number;
        height?: number;
    }[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    formatted_phone_number?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    website?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    url?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    opening_hours?: import("mongoose").SchemaDefinitionProperty<string[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    current_opening_hours?: import("mongoose").SchemaDefinitionProperty<{
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
    }, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    open_now?: import("mongoose").SchemaDefinitionProperty<boolean, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    reviews?: import("mongoose").SchemaDefinitionProperty<{
        autor?: string;
        rating?: number;
        texto?: string;
        data?: string;
    }[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    formatted_address?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    address_components?: import("mongoose").SchemaDefinitionProperty<{
        tipo?: string[];
        nome_longo?: string;
        nome_curto?: string;
        linguagem?: string;
    }[], Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    business_status?: import("mongoose").SchemaDefinitionProperty<string, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    criadoEm?: import("mongoose").SchemaDefinitionProperty<Date, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    atualizadoEm?: import("mongoose").SchemaDefinitionProperty<Date, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    deletedAt?: import("mongoose").SchemaDefinitionProperty<Date, Local, Document<unknown, {}, Local, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Local & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Local>;
