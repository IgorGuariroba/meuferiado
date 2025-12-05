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
    preco: number;
    imagens: string[];
    contato?: Contato;
    comodidades: string[];
    avaliacao?: number;
    cidade?: Types.ObjectId;
    criadoEm: Date;
    atualizadoEm: Date;
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
    cidade?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Local, Document<unknown, {}, Local, {
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
}, Local>;
