import { CidadesService } from './services/cidades.service';
import { BuscarCidadesDto } from './dto/buscar-cidades.dto';
import { BuscarCidadeAtualDto } from './dto/buscar-cidade-atual.dto';
export declare class CidadesController {
    private readonly cidadesService;
    constructor(cidadesService: CidadesService);
    obterCidadeAtual(query: BuscarCidadeAtualDto): Promise<{
        success: boolean;
        data: {
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
        };
        fonte: string;
    }>;
    obterCidadesVizinhas(query: BuscarCidadesDto): Promise<{
        success: boolean;
        data: any[];
        total: number;
        fonte: string;
    }>;
}
