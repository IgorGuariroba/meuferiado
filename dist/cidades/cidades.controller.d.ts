import { CidadesService } from './services/cidades.service';
import { ListarCidadesDto } from './dto/listar-cidades.dto';
import { BuscarLocaisDto } from './dto/buscar-locais.dto';
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
    buscarLocais(query: BuscarLocaisDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
