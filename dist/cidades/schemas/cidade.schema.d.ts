import { Document } from 'mongoose';
export type CidadeDocument = Cidade & Document;
export declare class Cidade {
    nome: string;
    estado?: string;
    pais?: string;
    localizacao: {
        type: 'Point';
        coordinates: [number, number];
    };
    criadoEm: Date;
    atualizadoEm: Date;
}
export declare const CidadeSchema: import("mongoose").Schema<Cidade, import("mongoose").Model<Cidade, any, any, any, Document<unknown, any, Cidade, any, import("mongoose").DefaultSchemaOptions> & Cidade & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, Cidade>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Cidade, Document<unknown, {}, Cidade, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    nome?: import("mongoose").SchemaDefinitionProperty<string, Cidade, Document<unknown, {}, Cidade, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    estado?: import("mongoose").SchemaDefinitionProperty<string, Cidade, Document<unknown, {}, Cidade, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    pais?: import("mongoose").SchemaDefinitionProperty<string, Cidade, Document<unknown, {}, Cidade, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    localizacao?: import("mongoose").SchemaDefinitionProperty<{
        type: "Point";
        coordinates: [number, number];
    }, Cidade, Document<unknown, {}, Cidade, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    criadoEm?: import("mongoose").SchemaDefinitionProperty<Date, Cidade, Document<unknown, {}, Cidade, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    atualizadoEm?: import("mongoose").SchemaDefinitionProperty<Date, Cidade, Document<unknown, {}, Cidade, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Cidade & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Cidade>;
