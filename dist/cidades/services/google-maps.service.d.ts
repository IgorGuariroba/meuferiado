import { ConfigService } from '@nestjs/config';
export declare class GoogleMapsService {
    private configService;
    private client;
    private apiKey;
    constructor(configService: ConfigService);
    obterCidadeAtual(lat: number, lon: number): Promise<{
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
        coordenadas?: undefined;
    } | {
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
        coordenadas: {
            lat: number;
            lon: number;
        };
    }>;
    obterCidadesVizinhas(lat: number, lon: number, raioKm: number): Promise<any[]>;
}
