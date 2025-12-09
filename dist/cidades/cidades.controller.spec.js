"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const cidades_controller_1 = require("./cidades.controller");
const cidades_service_1 = require("./services/cidades.service");
describe('CidadesController', () => {
    let controller;
    let service;
    const mockCidadesService = {
        obterCidadeAtual: jest.fn(),
        obterCidadesVizinhas: jest.fn(),
        listarTodasCidades: jest.fn(),
        buscarCoordenadasPorEndereco: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [cidades_controller_1.CidadesController],
            providers: [
                {
                    provide: cidades_service_1.CidadesService,
                    useValue: mockCidadesService,
                },
            ],
        }).compile();
        controller = module.get(cidades_controller_1.CidadesController);
        service = module.get(cidades_service_1.CidadesService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('deve ser definido', () => {
        expect(controller).toBeDefined();
    });
    describe('GET /api/cidades - obterCidades', () => {
        it('deve retornar cidade atual e cidades vizinhas quando buscar por coordenadas', async () => {
            const mockCidadeAtual = {
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                endereco_completo: 'São Paulo, SP, Brasil',
                coordenadas: { lat: -23.5178, lon: -46.1894 },
                doMongoDB: false,
            };
            const mockCidadesVizinhas = {
                cidades: [
                    { nome: 'Osasco', estado: 'SP', pais: 'BR', distancia_km: 18.03 },
                    { nome: 'Guarulhos', estado: 'SP', pais: 'BR', distancia_km: 23.76 },
                ],
                total: 2,
                limit: 20,
                skip: 0,
                doMongoDB: false,
            };
            mockCidadesService.obterCidadeAtual.mockResolvedValue(mockCidadeAtual);
            mockCidadesService.obterCidadesVizinhas.mockResolvedValue(mockCidadesVizinhas);
            const query = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 30,
                limit: 20,
                skip: 0,
            };
            const result = await controller.obterCidades(query);
            expect(result.success).toBe(true);
            expect(result.data.cidadeAtual).toBeDefined();
            expect(result.data.cidadeAtual.cidade).toBe('São Paulo');
            expect(result.data.cidadesVizinhas).toBeDefined();
            expect(result.data.cidadesVizinhas.cidades).toHaveLength(2);
            expect(result.data.cidadesVizinhas.fonte).toBe('Google Maps API');
            expect(mockCidadesService.obterCidadeAtual).toHaveBeenCalledWith(-23.5178, -46.1894);
            expect(mockCidadesService.obterCidadesVizinhas).toHaveBeenCalledWith(-23.5178, -46.1894, 30, 20, 0);
        });
        it('deve retornar cidade atual e cidades vizinhas quando buscar por endereço', async () => {
            const mockCidadeAtual = {
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                endereco_completo: 'São Paulo, SP, Brasil',
                coordenadas: { lat: -23.5557714, lon: -46.6395571 },
                doMongoDB: false,
            };
            const mockCidadesVizinhas = {
                cidades: [
                    { nome: 'Osasco', estado: 'SP', pais: 'BR', distancia_km: 18.03 },
                ],
                total: 1,
                limit: 20,
                skip: 0,
                doMongoDB: false,
            };
            mockCidadesService.buscarCoordenadasPorEndereco = jest.fn().mockResolvedValue(mockCidadeAtual);
            mockCidadesService.obterCidadeAtual = jest.fn().mockResolvedValue(mockCidadeAtual);
            mockCidadesService.obterCidadesVizinhas = jest.fn().mockResolvedValue(mockCidadesVizinhas);
            const query = {
                endereco: 'São Paulo, SP',
                raioKm: 30,
            };
            const result = await controller.obterCidades(query);
            expect(result.success).toBe(true);
            expect(result.data.cidadeAtual).toBeDefined();
            expect(result.data.cidadesVizinhas).toBeDefined();
        });
        it('deve lançar erro quando não fornecer coordenadas nem endereço', async () => {
            const query = {
                raioKm: 30,
            };
            await expect(controller.obterCidades(query)).rejects.toThrow(common_1.HttpException);
            await expect(controller.obterCidades(query)).rejects.toThrow('É necessário fornecer coordenadas (lat e lon) OU um endereco');
        });
        it('deve validar limit entre 1 e 100', async () => {
            const query = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 30,
                limit: 150,
            };
            await expect(controller.obterCidades(query)).rejects.toThrow(common_1.HttpException);
            await expect(controller.obterCidades(query)).rejects.toThrow('Limit deve ser um número entre 1 e 100');
        });
        it('deve validar skip >= 0', async () => {
            const query = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 30,
                skip: -1,
            };
            await expect(controller.obterCidades(query)).rejects.toThrow(common_1.HttpException);
            await expect(controller.obterCidades(query)).rejects.toThrow('Skip deve ser um número maior ou igual a 0');
        });
        it('deve validar raioKm entre 1 e 1000', async () => {
            const query = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 0,
            };
            await expect(controller.obterCidades(query)).rejects.toThrow(common_1.HttpException);
        });
        it('deve aplicar paginação corretamente', async () => {
            const mockCidadeAtual = {
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
                endereco_completo: 'São Paulo, SP, Brasil',
                coordenadas: { lat: -23.5178, lon: -46.1894 },
                doMongoDB: false,
            };
            const mockCidadesVizinhas = {
                cidades: [
                    { nome: 'Cidade 1', estado: 'SP', pais: 'BR', distancia_km: 10 },
                    { nome: 'Cidade 2', estado: 'SP', pais: 'BR', distancia_km: 15 },
                ],
                total: 10,
                limit: 2,
                skip: 2,
                doMongoDB: false,
            };
            mockCidadesService.obterCidadeAtual.mockResolvedValue(mockCidadeAtual);
            mockCidadesService.obterCidadesVizinhas.mockResolvedValue(mockCidadesVizinhas);
            const query = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 30,
                limit: 2,
                skip: 2,
            };
            const result = await controller.obterCidades(query);
            expect(result.data.cidadesVizinhas.limit).toBe(2);
            expect(result.data.cidadesVizinhas.skip).toBe(2);
            expect(mockCidadesService.obterCidadesVizinhas).toHaveBeenCalledWith(-23.5178, -46.1894, 30, 2, 2);
        });
        it('deve tratar erros do service corretamente', async () => {
            mockCidadesService.obterCidadeAtual.mockRejectedValue(new Error('Erro ao buscar cidade'));
            const query = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 30,
            };
            await expect(controller.obterCidades(query)).rejects.toThrow(common_1.HttpException);
        });
    });
    describe('GET /api/cidades/listar - listarCidades', () => {
        it('deve listar todas as cidades com paginação', async () => {
            const mockResultado = {
                cidades: [
                    { nome: 'São Paulo', estado: 'SP', pais: 'BR', lat: -23.5178, lon: -46.1894 },
                    { nome: 'Rio de Janeiro', estado: 'RJ', pais: 'BR', lat: -22.9068, lon: -43.1729 },
                ],
                total: 2,
                limit: 10,
                skip: 0,
            };
            mockCidadesService.listarTodasCidades.mockResolvedValue(mockResultado);
            const query = { limit: 10, skip: 0 };
            const result = await controller.listarCidades(query);
            expect(result).toEqual({
                success: true,
                data: mockResultado,
            });
            expect(mockCidadesService.listarTodasCidades).toHaveBeenCalledWith(10, 0);
        });
        it('deve tratar erros ao listar cidades', async () => {
            mockCidadesService.listarTodasCidades.mockRejectedValue(new Error('Erro ao listar'));
            const query = { limit: 10, skip: 0 };
            await expect(controller.listarCidades(query)).rejects.toThrow(common_1.HttpException);
        });
    });
});
//# sourceMappingURL=cidades.controller.spec.js.map