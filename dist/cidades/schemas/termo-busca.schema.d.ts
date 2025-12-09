import { Document } from 'mongoose';
export type TermoBuscaDocument = TermoBusca & Document;
export declare class TermoBusca {
    termo: string;
    ativo?: boolean;
    descricao?: string;
}
export declare const TermoBuscaSchema: import("mongoose").Schema<TermoBusca, import("mongoose").Model<TermoBusca, any, any, any, Document<unknown, any, TermoBusca, any, import("mongoose").DefaultSchemaOptions> & TermoBusca & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, TermoBusca>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TermoBusca, Document<unknown, {}, TermoBusca, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<TermoBusca & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    termo?: import("mongoose").SchemaDefinitionProperty<string, TermoBusca, Document<unknown, {}, TermoBusca, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<TermoBusca & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    ativo?: import("mongoose").SchemaDefinitionProperty<boolean, TermoBusca, Document<unknown, {}, TermoBusca, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<TermoBusca & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    descricao?: import("mongoose").SchemaDefinitionProperty<string, TermoBusca, Document<unknown, {}, TermoBusca, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<TermoBusca & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, TermoBusca>;
