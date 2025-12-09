"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const locais_service_1 = require("./locais.service");
const google_maps_service_1 = require("../../cidades/services/google-maps.service");
const cidades_service_1 = require("../../cidades/services/cidades.service");
const local_schema_1 = require("../schemas/local.schema");
const cidade_schema_1 = require("../../cidades/schemas/cidade.schema");
describe('LocaisService', () => {
    let service;
    let localModel;
    let cidadeModel;
    let googleMapsService;
    let cidadesService;
    const mockLocalModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
    }));
    mockLocalModel.find = jest.fn();
    mockLocalModel.findById = jest.fn();
    mockLocalModel.findOne = jest.fn();
    mockLocalModel.create = jest.fn();
    mockLocalModel.countDocuments = jest.fn();
    const mockCidadeModel = {
        findOne: jest.fn(),
    };
    const mockGoogleMapsService = {
        buscarPorEndereco: jest.fn(),
    };
    const mockCidadesService = {
        buscarCidadePorCoordenadas: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                locais_service_1.LocaisService,
                {
                    provide: (0, mongoose_1.getModelToken)(local_schema_1.Local.name),
                    useValue: mockLocalModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(cidade_schema_1.Cidade.name),
                    useValue: mockCidadeModel,
                },
                {
                    provide: google_maps_service_1.GoogleMapsService,
                    useValue: mockGoogleMapsService,
                },
                {
                    provide: cidades_service_1.CidadesService,
                    useValue: mockCidadesService,
                },
            ],
        }).compile();
        service = module.get(locais_service_1.LocaisService);
        localModel = module.get((0, mongoose_1.getModelToken)(local_schema_1.Local.name));
        cidadeModel = module.get((0, mongoose_1.getModelToken)(cidade_schema_1.Cidade.name));
        googleMapsService = module.get(google_maps_service_1.GoogleMapsService);
        cidadesService = module.get(cidades_service_1.CidadesService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });
    describe('criar', () => {
        it('deve criar local com coordenadas fornecidas', async () => {
            const criarLocalDto = {
                tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                nome: 'Casa de Praia',
                endereco: 'Rua das Praias, 123',
                lat: -23.5178,
                lon: -46.1894,
                preco: 500,
            };
            const mockCidade = {
                _id: new mongoose_2.Types.ObjectId(),
                nome: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
            };
            mockCidadesService.buscarCidadePorCoordenadas.mockResolvedValue({
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'BR',
            });
            mockCidadeModel.findOne.mockResolvedValue(mockCidade);
            const mockLocal = {
                _id: new mongoose_2.Types.ObjectId(),
                ...criarLocalDto,
                localizacao: {
                    type: 'Point',
                    coordinates: [-46.1894, -23.5178],
                },
                cidade: mockCidade._id,
                save: jest.fn().mockResolvedValue(true),
            };
            mockLocalModel.mockImplementation(() => mockLocal);
            const result = await service.criar(criarLocalDto);
            expect(result).toBeDefined();
            expect(mockLocal.save).toHaveBeenCalled();
            expect(mockLocalModel).toHaveBeenCalled();
        });
        it('deve buscar coordenadas por endereço quando não fornecidas', async () => {
            const criarLocalDto = {
                tipo: local_schema_1.TipoLocal.CHALE,
                nome: 'Chalé na Montanha',
                endereco: 'Rua das Montanhas, 456',
                preco: 300,
            };
            mockGoogleMapsService.buscarPorEndereco.mockResolvedValue({
                coordenadas: {
                    lat: -23.5178,
                    lon: -46.1894,
                },
            });
            mockCidadesService.buscarCidadePorCoordenadas.mockResolvedValue(null);
            const mockLocal = {
                _id: new mongoose_2.Types.ObjectId(),
                ...criarLocalDto,
                localizacao: {
                    type: 'Point',
                    coordinates: [-46.1894, -23.5178],
                },
                save: jest.fn().mockResolvedValue(true),
            };
            mockLocalModel.mockImplementation(() => mockLocal);
            const result = await service.criar(criarLocalDto);
            expect(result).toBeDefined();
            expect(mockGoogleMapsService.buscarPorEndereco).toHaveBeenCalledWith(criarLocalDto.endereco);
            expect(mockLocalModel).toHaveBeenCalled();
        });
        it('deve lançar erro quando endereço não fornecido e coordenadas ausentes', async () => {
            const criarLocalDto = {
                tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                nome: 'Casa de Praia',
                endereco: '',
                preco: 500,
            };
            await expect(service.criar(criarLocalDto)).rejects.toThrow('É necessário fornecer coordenadas (lat/lon) ou um endereço');
        });
    });
    describe('listar', () => {
        it('deve listar locais sem filtros', async () => {
            const mockLocais = [
                {
                    _id: new mongoose_2.Types.ObjectId(),
                    tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                    nome: 'Casa 1',
                    preco: 500,
                    toObject: jest.fn().mockReturnValue({
                        _id: new mongoose_2.Types.ObjectId(),
                        tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                        nome: 'Casa 1',
                        preco: 500,
                    }),
                },
            ];
            const mockQuery = {
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLocais),
            };
            mockLocalModel.find.mockReturnValue(mockQuery);
            mockLocalModel.countDocuments.mockResolvedValue(1);
            const listarLocaisDto = {};
            const result = await service.listar(listarLocaisDto);
            expect(result.locais).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.limit).toBe(20);
            expect(result.skip).toBe(0);
        });
        it('deve filtrar por tipo', async () => {
            const mockLocais = [
                {
                    _id: new mongoose_2.Types.ObjectId(),
                    tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                    nome: 'Casa de Praia',
                    preco: 500,
                    toObject: jest.fn().mockReturnValue({
                        tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                        nome: 'Casa de Praia',
                        preco: 500,
                    }),
                },
            ];
            const mockQuery = {
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLocais),
            };
            mockLocalModel.find.mockReturnValue(mockQuery);
            mockLocalModel.countDocuments.mockResolvedValue(1);
            const listarLocaisDto = { tipo: local_schema_1.TipoLocal.CASA_PRAIA };
            const result = await service.listar(listarLocaisDto);
            expect(result.locais).toHaveLength(1);
            expect(mockLocalModel.find).toHaveBeenCalledWith(expect.objectContaining({ tipo: local_schema_1.TipoLocal.CASA_PRAIA }));
        });
        it('deve filtrar por faixa de preço', async () => {
            const mockLocais = [
                {
                    _id: new mongoose_2.Types.ObjectId(),
                    tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                    nome: 'Casa de Praia',
                    preco: 500,
                    toObject: jest.fn().mockReturnValue({
                        tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                        nome: 'Casa de Praia',
                        preco: 500,
                    }),
                },
            ];
            const mockQuery = {
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLocais),
            };
            mockLocalModel.find.mockReturnValue(mockQuery);
            mockLocalModel.countDocuments.mockResolvedValue(1);
            const listarLocaisDto = { precoMin: 400, precoMax: 600 };
            const result = await service.listar(listarLocaisDto);
            expect(result.locais).toHaveLength(1);
            expect(mockLocalModel.find).toHaveBeenCalledWith(expect.objectContaining({
                preco: { $gte: 400, $lte: 600 },
            }));
        });
        it('deve buscar por proximidade geográfica', async () => {
            const mockLocais = [
                {
                    _id: new mongoose_2.Types.ObjectId(),
                    tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                    nome: 'Casa de Praia',
                    preco: 500,
                    localizacao: {
                        coordinates: [-46.1894, -23.5178],
                    },
                    toObject: jest.fn().mockReturnValue({
                        tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                        nome: 'Casa de Praia',
                        preco: 500,
                        localizacao: {
                            coordinates: [-46.1894, -23.5178],
                        },
                    }),
                },
            ];
            const mockQuery = {
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLocais),
            };
            mockLocalModel.find.mockReturnValue(mockQuery);
            mockLocalModel.countDocuments.mockResolvedValue(1);
            const listarLocaisDto = {
                lat: -23.5178,
                lon: -46.1894,
                raioKm: 30,
            };
            const result = await service.listar(listarLocaisDto);
            expect(result.locais).toHaveLength(1);
            expect(result.locais[0].distancia_km).toBeDefined();
        });
        it('deve aplicar paginação', async () => {
            const mockLocais = Array.from({ length: 3 }, (_, i) => ({
                _id: new mongoose_2.Types.ObjectId(),
                tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                nome: `Casa ${i + 1}`,
                preco: 500,
                toObject: jest.fn().mockReturnValue({
                    tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                    nome: `Casa ${i + 1}`,
                    preco: 500,
                }),
            }));
            const mockQuery = {
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLocais),
            };
            mockLocalModel.find.mockReturnValue(mockQuery);
            mockLocalModel.countDocuments.mockResolvedValue(10);
            const listarLocaisDto = { limit: 3, skip: 2 };
            const result = await service.listar(listarLocaisDto);
            expect(result.limit).toBe(3);
            expect(result.skip).toBe(2);
            expect(result.total).toBe(10);
            expect(mockQuery.skip).toHaveBeenCalledWith(2);
            expect(mockQuery.limit).toHaveBeenCalledWith(3);
        });
    });
    describe('buscarPorId', () => {
        it('deve retornar local quando encontrado', async () => {
            const mockLocal = {
                _id: new mongoose_2.Types.ObjectId(),
                tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                nome: 'Casa de Praia',
                preco: 500,
            };
            mockLocalModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockLocal),
            });
            const result = await service.buscarPorId(mockLocal._id.toString());
            expect(result).toEqual(mockLocal);
        });
        it('deve lançar NotFoundException quando local não encontrado', async () => {
            mockLocalModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            await expect(service.buscarPorId('507f1f77bcf86cd799439099')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('atualizar', () => {
        it('deve atualizar local existente', async () => {
            const mockLocal = {
                _id: new mongoose_2.Types.ObjectId(),
                tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                nome: 'Casa de Praia',
                preco: 500,
                localizacao: {
                    coordinates: [-46.1894, -23.5178],
                },
                save: jest.fn().mockResolvedValue(true),
            };
            const atualizarLocalDto = {
                nome: 'Casa de Praia Atualizada',
                preco: 600,
            };
            mockLocalModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockLocal),
            });
            const result = await service.atualizar(mockLocal._id.toString(), atualizarLocalDto);
            expect(result).toBeDefined();
            expect(mockLocal.save).toHaveBeenCalled();
        });
        it('deve atualizar coordenadas quando endereço for atualizado', async () => {
            const mockLocal = {
                _id: new mongoose_2.Types.ObjectId(),
                tipo: local_schema_1.TipoLocal.CASA_PRAIA,
                nome: 'Casa de Praia',
                preco: 500,
                localizacao: {
                    coordinates: [-46.1894, -23.5178],
                },
                save: jest.fn().mockResolvedValue(true),
            };
            const atualizarLocalDto = {
                endereco: 'Novo Endereço, 789',
            };
            mockLocalModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockLocal),
            });
            mockGoogleMapsService.buscarPorEndereco.mockResolvedValue({
                coordenadas: {
                    lat: -23.6,
                    lon: -46.2,
                },
            });
            mockCidadesService.buscarCidadePorCoordenadas.mockResolvedValue(null);
            const result = await service.atualizar(mockLocal._id.toString(), atualizarLocalDto);
            expect(result).toBeDefined();
            expect(mockGoogleMapsService.buscarPorEndereco).toHaveBeenCalledWith('Novo Endereço, 789');
        });
        it('deve lançar NotFoundException quando local não encontrado', async () => {
            mockLocalModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            const atualizarLocalDto = {
                preco: 600,
            };
            await expect(service.atualizar('507f1f77bcf86cd799439099', atualizarLocalDto)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=locais.service.spec.js.map