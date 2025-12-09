"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const cidades_service_1 = require("./cidades.service");
const google_maps_service_1 = require("./google-maps.service");
const cidade_schema_1 = require("../schemas/cidade.schema");
const local_schema_1 = require("../../locais/schemas/local.schema");
describe('CidadesService', () => {
    let service;
    let cidadeModel;
    let googleMapsService;
    const mockCidadeModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        countDocuments: jest.fn(),
    };
    const mockLocalModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };
    const mockGoogleMapsService = {
        obterCidadeAtual: jest.fn(),
        obterCidadesVizinhas: jest.fn(),
        buscarPorEndereco: jest.fn(),
        buscarLocaisPorCidade: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                cidades_service_1.CidadesService,
                {
                    provide: (0, mongoose_1.getModelToken)(cidade_schema_1.Cidade.name),
                    useValue: mockCidadeModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(local_schema_1.Local.name),
                    useValue: mockLocalModel,
                },
                {
                    provide: google_maps_service_1.GoogleMapsService,
                    useValue: mockGoogleMapsService,
                },
            ],
        }).compile();
        service = module.get(cidades_service_1.CidadesService);
        cidadeModel = module.get((0, mongoose_1.getModelToken)(cidade_schema_1.Cidade.name));
        googleMapsService = module.get(google_maps_service_1.GoogleMapsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });
    describe('buscarCidadePorCoordenadas', () => {
        it('deve retornar cidade quando encontrada no MongoDB', async () => {
            const mockCidade = {
                nome: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                localizacao: {
                    type: 'Point',
                    coordinates: [-46.1894, -23.5178],
                },
            };
            const mockQuery = {
                limit: jest.fn().mockResolvedValue([mockCidade]),
            };
            mockCidadeModel.find = jest.fn().mockReturnValue(mockQuery);
            const result = await service.buscarCidadePorCoordenadas(-23.5178, -46.1894, 1);
            expect(result).toEqual({
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                endereco_completo: 'São Paulo, SP, BR',
            });
            expect(mockCidadeModel.find).toHaveBeenCalled();
            expect(mockQuery.limit).toHaveBeenCalledWith(1);
        });
        it('deve retornar null quando cidade não encontrada', async () => {
            const mockQuery = {
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            };
            mockCidadeModel.find.mockReturnValue(mockQuery);
            const result = await service.buscarCidadePorCoordenadas(-23.5178, -46.1894, 1);
            expect(result).toBeNull();
        });
    });
    describe('obterCidadeAtual', () => {
        it('deve retornar cidade do MongoDB quando encontrada', async () => {
            const mockCidadeMongo = {
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                endereco_completo: 'São Paulo, SP, BR',
            };
            jest.spyOn(service, 'buscarCidadePorCoordenadas').mockResolvedValue(mockCidadeMongo);
            const result = await service.obterCidadeAtual(-23.5178, -46.1894);
            expect(result).toEqual({
                ...mockCidadeMongo,
                doMongoDB: true,
            });
        });
        it('deve buscar na API quando não encontrar no MongoDB', async () => {
            const mockCidadeApi = {
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                endereco_completo: 'São Paulo, SP, Brasil',
                coordenadas: { lat: -23.5178, lon: -46.1894 },
            };
            jest.spyOn(service, 'buscarCidadePorCoordenadas').mockResolvedValue(null);
            mockGoogleMapsService.obterCidadeAtual.mockResolvedValue(mockCidadeApi);
            jest.spyOn(service, 'salvarCidade').mockResolvedValue(null);
            const result = await service.obterCidadeAtual(-23.5178, -46.1894);
            expect(result).toEqual({
                ...mockCidadeApi,
                doMongoDB: false,
            });
            expect(mockGoogleMapsService.obterCidadeAtual).toHaveBeenCalledWith(-23.5178, -46.1894);
        });
    });
    describe('obterCidadesVizinhas', () => {
        it('deve retornar cidades do MongoDB quando encontrar 3 ou mais', async () => {
            const mockCidadesMongo = [
                { nome: 'Cidade 1', estado: 'SP', pais: 'BR', distancia_km: 10, lat: -23.5, lon: -46.1 },
                { nome: 'Cidade 2', estado: 'SP', pais: 'BR', distancia_km: 15, lat: -23.6, lon: -46.2 },
                { nome: 'Cidade 3', estado: 'SP', pais: 'BR', distancia_km: 20, lat: -23.7, lon: -46.3 },
            ];
            jest.spyOn(service, 'buscarCidadesProximas').mockResolvedValue(mockCidadesMongo);
            const result = await service.obterCidadesVizinhas(-23.5178, -46.1894, 30, 20, 0);
            expect(result.doMongoDB).toBe(true);
            expect(result.cidades).toHaveLength(3);
            expect(result.total).toBe(3);
        });
        it('deve buscar na API quando encontrar menos de 3 cidades no MongoDB', async () => {
            const mockCidadesMongo = [
                { nome: 'Cidade 1', estado: 'SP', pais: 'BR', distancia_km: 10, lat: -23.5, lon: -46.1 },
            ];
            const mockCidadesApi = [
                { nome: 'Cidade 2', estado: 'SP', pais: 'BR', distancia_km: 15, lat: -23.6, lon: -46.2 },
                { nome: 'Cidade 3', estado: 'SP', pais: 'BR', distancia_km: 20, lat: -23.7, lon: -46.3 },
            ];
            jest.spyOn(service, 'buscarCidadesProximas').mockResolvedValue(mockCidadesMongo);
            mockGoogleMapsService.obterCidadesVizinhas.mockResolvedValue(mockCidadesApi);
            jest.spyOn(service, 'salvarCidades').mockResolvedValue([]);
            const result = await service.obterCidadesVizinhas(-23.5178, -46.1894, 30, 20, 0);
            expect(result.doMongoDB).toBe(false);
            expect(mockGoogleMapsService.obterCidadesVizinhas).toHaveBeenCalledWith(-23.5178, -46.1894, 30);
        });
        it('deve aplicar paginação corretamente', async () => {
            const mockCidadesMongo = Array.from({ length: 10 }, (_, i) => ({
                nome: `Cidade ${i + 1}`,
                estado: 'SP',
                pais: 'BR',
                distancia_km: (i + 1) * 5,
                lat: -23.5,
                lon: -46.1,
            }));
            jest.spyOn(service, 'buscarCidadesProximas').mockResolvedValue(mockCidadesMongo);
            const result = await service.obterCidadesVizinhas(-23.5178, -46.1894, 30, 3, 2);
            expect(result.limit).toBe(3);
            expect(result.skip).toBe(2);
            expect(result.cidades).toHaveLength(3);
        });
    });
    describe('listarTodasCidades', () => {
        it('deve listar todas as cidades com paginação', async () => {
            const mockCidades = [
                {
                    nome: 'São Paulo',
                    estado: 'SP',
                    pais: 'BR',
                    localizacao: { coordinates: [-46.1894, -23.5178] },
                    criadoEm: new Date(),
                    atualizadoEm: new Date(),
                },
                {
                    nome: 'Rio de Janeiro',
                    estado: 'RJ',
                    pais: 'BR',
                    localizacao: { coordinates: [-43.1729, -22.9068] },
                    criadoEm: new Date(),
                    atualizadoEm: new Date(),
                },
            ];
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockCidades),
            };
            mockCidadeModel.find.mockReturnValue(mockQuery);
            mockCidadeModel.countDocuments.mockResolvedValue(2);
            const result = await service.listarTodasCidades(10, 0);
            expect(result.total).toBe(2);
            expect(result.cidades).toHaveLength(2);
            expect(result.limit).toBe(10);
            expect(result.skip).toBe(0);
        });
    });
});
//# sourceMappingURL=cidades.service.spec.js.map