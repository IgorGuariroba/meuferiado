import { CidadesService } from './services/cidades.service';
import { BuscarCidadesDto } from './dto/buscar-cidades.dto';
export declare class CidadesController {
    private readonly cidadesService;
    constructor(cidadesService: CidadesService);
    obterCidades(query: BuscarCidadesDto): Promise<{
        success: boolean;
        data: {
            cidadeAtual: {
                fonte: string;
                doMongoDB: boolean;
                cidade: string;
                estado: string;
                pais: string;
                endereco_completo: string;
            } | {
                fonte: string;
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
            cidadesVizinhas: {
                cidades: any[];
                total: number;
                fonte: string;
            };
        };
    }>;
}
