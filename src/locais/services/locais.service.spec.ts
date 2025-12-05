import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { LocaisService } from './locais.service';
import { GoogleMapsService } from '../../cidades/services/google-maps.service';
import { CidadesService } from '../../cidades/services/cidades.service';
import { Local, LocalDocument, TipoLocal } from '../schemas/local.schema';
import { Cidade, CidadeDocument } from '../../cidades/schemas/cidade.schema';
import { CriarLocalDto } from '../dto/criar-local.dto';
import { AtualizarLocalDto } from '../dto/atualizar-local.dto';

describe('LocaisService', () => {
  let service: LocaisService;
  let localModel: Model<LocalDocument>;
  let cidadeModel: Model<CidadeDocument>;
  let googleMapsService: GoogleMapsService;
  let cidadesService: CidadesService;

  const mockLocalModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(true),
  })) as any;

  mockLocalModel.find = jest.fn();
  mockLocalModel.findById = jest.fn();
  mockLocalModel.findOne = jest.fn();
  mockLocalModel.create = jest.fn();
  mockLocalModel.countDocuments = jest.fn();

  const mockCidadeModel = {
    findOne: jest.fn(),
  } as any;

  const mockGoogleMapsService = {
    buscarPorEndereco: jest.fn(),
  };

  const mockCidadesService = {
    buscarCidadePorCoordenadas: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocaisService,
        {
          provide: getModelToken(Local.name),
          useValue: mockLocalModel,
        },
        {
          provide: getModelToken(Cidade.name),
          useValue: mockCidadeModel,
        },
        {
          provide: GoogleMapsService,
          useValue: mockGoogleMapsService,
        },
        {
          provide: CidadesService,
          useValue: mockCidadesService,
        },
      ],
    }).compile();

    service = module.get<LocaisService>(LocaisService);
    localModel = module.get<Model<LocalDocument>>(getModelToken(Local.name));
    cidadeModel = module.get<Model<CidadeDocument>>(getModelToken(Cidade.name));
    googleMapsService = module.get<GoogleMapsService>(GoogleMapsService);
    cidadesService = module.get<CidadesService>(CidadesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('criar', () => {
    it('deve criar local com coordenadas fornecidas', async () => {
      const criarLocalDto: CriarLocalDto = {
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia',
        endereco: 'Rua das Praias, 123',
        lat: -23.5178,
        lon: -46.1894,
        preco: 500,
      };

      const mockCidade = {
        _id: new Types.ObjectId(),
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
        _id: new Types.ObjectId(),
        ...criarLocalDto,
        localizacao: {
          type: 'Point',
          coordinates: [-46.1894, -23.5178],
        },
        cidade: mockCidade._id,
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock do construtor do modelo
      mockLocalModel.mockImplementation(() => mockLocal);

      const result = await service.criar(criarLocalDto);

      expect(result).toBeDefined();
      expect(mockLocal.save).toHaveBeenCalled();
      expect(mockLocalModel).toHaveBeenCalled();
    });

    it('deve buscar coordenadas por endereço quando não fornecidas', async () => {
      const criarLocalDto: CriarLocalDto = {
        tipo: TipoLocal.CHALE,
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
        _id: new Types.ObjectId(),
        ...criarLocalDto,
        localizacao: {
          type: 'Point',
          coordinates: [-46.1894, -23.5178],
        },
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock do construtor do modelo
      mockLocalModel.mockImplementation(() => mockLocal);

      const result = await service.criar(criarLocalDto);

      expect(result).toBeDefined();
      expect(mockGoogleMapsService.buscarPorEndereco).toHaveBeenCalledWith(criarLocalDto.endereco);
      expect(mockLocalModel).toHaveBeenCalled();
    });

    it('deve lançar erro quando endereço não fornecido e coordenadas ausentes', async () => {
      const criarLocalDto: CriarLocalDto = {
        tipo: TipoLocal.CASA_PRAIA,
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
          _id: new Types.ObjectId(),
          tipo: TipoLocal.CASA_PRAIA,
          nome: 'Casa 1',
          preco: 500,
          toObject: jest.fn().mockReturnValue({
            _id: new Types.ObjectId(),
            tipo: TipoLocal.CASA_PRAIA,
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
          _id: new Types.ObjectId(),
          tipo: TipoLocal.CASA_PRAIA,
          nome: 'Casa de Praia',
          preco: 500,
          toObject: jest.fn().mockReturnValue({
            tipo: TipoLocal.CASA_PRAIA,
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

      const listarLocaisDto = { tipo: TipoLocal.CASA_PRAIA };

      const result = await service.listar(listarLocaisDto);

      expect(result.locais).toHaveLength(1);
      expect(mockLocalModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: TipoLocal.CASA_PRAIA }),
      );
    });

    it('deve filtrar por faixa de preço', async () => {
      const mockLocais = [
        {
          _id: new Types.ObjectId(),
          tipo: TipoLocal.CASA_PRAIA,
          nome: 'Casa de Praia',
          preco: 500,
          toObject: jest.fn().mockReturnValue({
            tipo: TipoLocal.CASA_PRAIA,
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
      expect(mockLocalModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          preco: { $gte: 400, $lte: 600 },
        }),
      );
    });

    it('deve buscar por proximidade geográfica', async () => {
      const mockLocais = [
        {
          _id: new Types.ObjectId(),
          tipo: TipoLocal.CASA_PRAIA,
          nome: 'Casa de Praia',
          preco: 500,
          localizacao: {
            coordinates: [-46.1894, -23.5178],
          },
          toObject: jest.fn().mockReturnValue({
            tipo: TipoLocal.CASA_PRAIA,
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
        _id: new Types.ObjectId(),
        tipo: TipoLocal.CASA_PRAIA,
        nome: `Casa ${i + 1}`,
        preco: 500,
        toObject: jest.fn().mockReturnValue({
          tipo: TipoLocal.CASA_PRAIA,
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
        _id: new Types.ObjectId(),
        tipo: TipoLocal.CASA_PRAIA,
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

      await expect(service.buscarPorId('507f1f77bcf86cd799439099')).rejects.toThrow(NotFoundException);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar local existente', async () => {
      const mockLocal = {
        _id: new Types.ObjectId(),
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia',
        preco: 500,
        localizacao: {
          coordinates: [-46.1894, -23.5178],
        },
        save: jest.fn().mockResolvedValue(true),
      };

      const atualizarLocalDto: AtualizarLocalDto = {
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
        _id: new Types.ObjectId(),
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia',
        preco: 500,
        localizacao: {
          coordinates: [-46.1894, -23.5178],
        },
        save: jest.fn().mockResolvedValue(true),
      };

      const atualizarLocalDto: AtualizarLocalDto = {
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

      const atualizarLocalDto: AtualizarLocalDto = {
        preco: 600,
      };

      await expect(service.atualizar('507f1f77bcf86cd799439099', atualizarLocalDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

