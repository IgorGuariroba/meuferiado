import { ConfigService } from '@nestjs/config';
export declare class GoogleMapsService {
    private configService;
    private client;
    private apiKey;
    constructor(configService: ConfigService);
    buscarPorEndereco(endereco: string): Promise<{
        cidade: string;
        estado: string;
        pais: string;
        endereco_completo: string;
        coordenadas: {
            lat: any;
            lon: any;
        };
    }>;
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
    buscarDetalhesLocal(placeId: string): Promise<any>;
    buscarLocaisBasicosPorCidade(query: string, city: string): Promise<any[]>;
    buscarDetalhesLocais(locaisBasicos: any[]): Promise<any[]>;
    buscarLocaisPorCidade(query: string, city: string): Promise<any[]>;
    gerarUrlFoto(photoReference: string, maxWidth?: number, maxHeight?: number): string;
}
