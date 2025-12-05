import { Types } from 'mongoose';
import { LocaisService } from './services/locais.service';
import { CriarLocalDto } from './dto/criar-local.dto';
import { AtualizarLocalDto } from './dto/atualizar-local.dto';
import { ListarLocaisDto } from './dto/listar-locais.dto';
export declare class LocaisController {
    private readonly locaisService;
    constructor(locaisService: LocaisService);
    criar(criarLocalDto: CriarLocalDto): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, import("./schemas/local.schema").LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/local.schema").Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    listar(listarLocaisDto: ListarLocaisDto): Promise<{
        success: boolean;
        data: {
            locais: any[];
            total: number;
            limit: number;
            skip: number;
        };
    }>;
    buscarPorId(id: string): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, import("./schemas/local.schema").LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/local.schema").Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    atualizar(id: string, atualizarLocalDto: AtualizarLocalDto): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, import("./schemas/local.schema").LocalDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/local.schema").Local & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
