import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LocaisController } from './locais.controller';
import { LocaisService } from './services/locais.service';
import { TipoLocal } from './schemas/local.schema';

describe('LocaisController', () => {
  let controller: LocaisController;
  let service: LocaisService;

  const mockLocaisService = {
    criar: jest.fn(),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocaisController],
      providers: [
        {
          provide: LocaisService,
          useValue: mockLocaisService,
        },
      ],
    }).compile();

    controller = module.get<LocaisController>(LocaisController);
    service = module.get<LocaisService>(LocaisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/locais - criar', () => {
    it('deve criar um novo local de hospedagem', async () => {
      const criarLocalDto = {
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia Encantada',
        descricao: 'Linda casa de praia com vista para o mar',
        endereco: 'Rua das Praias, 123, Praia Grande, SP',
        preco: 500,
        imagens: ['https://exemplo.com/imagem1.jpg'],
        contato: {
          telefone: '(11) 98765-4321',
          email: 'contato@exemplo.com',
        },
        comodidades: ['piscina', 'wifi'],
        avaliacao: 4.5,
      };

      const mockLocal = {
        _id: '507f1f77bcf86cd799439011',
        ...criarLocalDto,
        localizacao: {
          type: 'Point',
          coordinates: [-46.1894, -23.5178],
        },
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      mockLocaisService.criar.mockResolvedValue(mockLocal);

      const result = await controller.criar(criarLocalDto);

      expect(result).toEqual({
        success: true,
        data: mockLocal,
      });

      expect(mockLocaisService.criar).toHaveBeenCalledWith(criarLocalDto);
    });

    it('deve criar local apenas com campos obrigatórios', async () => {
      const criarLocalDto = {
        tipo: TipoLocal.CHALE,
        nome: 'Chalé na Montanha',
        endereco: 'Rua das Montanhas, 456',
        preco: 300,
      };

      const mockLocal = {
        _id: '507f1f77bcf86cd799439012',
        ...criarLocalDto,
        localizacao: {
          type: 'Point',
          coordinates: [-46.1894, -23.5178],
        },
        imagens: [],
        comodidades: [],
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      mockLocaisService.criar.mockResolvedValue(mockLocal);

      const result = await controller.criar(criarLocalDto);

      expect(result.success).toBe(true);
      expect(result.data.nome).toBe('Chalé na Montanha');
    });

    it('deve tratar erros ao criar local', async () => {
      const criarLocalDto = {
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia',
        endereco: 'Endereço inválido',
        preco: 500,
      };

      mockLocaisService.criar.mockRejectedValue(new Error('Erro ao criar local'));

      await expect(controller.criar(criarLocalDto)).rejects.toThrow(HttpException);
    });
  });

  describe('GET /api/locais - listar', () => {
    it('deve listar locais sem filtros', async () => {
      const mockResultado = {
        locais: [
          {
            _id: '507f1f77bcf86cd799439011',
            tipo: TipoLocal.CASA_PRAIA,
            nome: 'Casa de Praia 1',
            preco: 500,
          },
          {
            _id: '507f1f77bcf86cd799439012',
            tipo: TipoLocal.CHALE,
            nome: 'Chalé 1',
            preco: 300,
          },
        ],
        total: 2,
        limit: 20,
        skip: 0,
      };

      mockLocaisService.listar.mockResolvedValue(mockResultado);

      const query = {};
      const result = await controller.listar(query);

      expect(result).toEqual({
        success: true,
        data: mockResultado,
      });

      expect(mockLocaisService.listar).toHaveBeenCalled();
    });

    it('deve filtrar locais por tipo', async () => {
      const mockResultado = {
        locais: [
          {
            _id: '507f1f77bcf86cd799439011',
            tipo: TipoLocal.CASA_PRAIA,
            nome: 'Casa de Praia 1',
            preco: 500,
          },
        ],
        total: 1,
        limit: 20,
        skip: 0,
      };

      mockLocaisService.listar.mockResolvedValue(mockResultado);

      const query = { tipo: TipoLocal.CASA_PRAIA };
      const result = await controller.listar(query);

      expect(result.success).toBe(true);
      expect(result.data.locais).toHaveLength(1);
      expect(result.data.locais[0].tipo).toBe(TipoLocal.CASA_PRAIA);
    });

    it('deve filtrar locais por faixa de preço', async () => {
      const mockResultado = {
        locais: [
          {
            _id: '507f1f77bcf86cd799439011',
            tipo: TipoLocal.CASA_PRAIA,
            nome: 'Casa de Praia 1',
            preco: 500,
          },
        ],
        total: 1,
        limit: 20,
        skip: 0,
      };

      mockLocaisService.listar.mockResolvedValue(mockResultado);

      const query = { precoMin: 400, precoMax: 600 };
      const result = await controller.listar(query);

      expect(result.success).toBe(true);
      expect(mockLocaisService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ precoMin: 400, precoMax: 600 }),
      );
    });

    it('deve buscar locais por proximidade', async () => {
      const mockResultado = {
        locais: [
          {
            _id: '507f1f77bcf86cd799439011',
            tipo: TipoLocal.CASA_PRAIA,
            nome: 'Casa de Praia 1',
            preco: 500,
            distancia_km: 5.5,
          },
        ],
        total: 1,
        limit: 20,
        skip: 0,
      };

      mockLocaisService.listar.mockResolvedValue(mockResultado);

      const query = {
        lat: -23.5178,
        lon: -46.1894,
        raioKm: 30,
      };

      const result = await controller.listar(query);

      expect(result.success).toBe(true);
      expect(result.data.locais[0].distancia_km).toBeDefined();
      expect(mockLocaisService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ lat: -23.5178, lon: -46.1894, raioKm: 30 }),
      );
    });

    it('deve aplicar paginação', async () => {
      const mockResultado = {
        locais: [
          {
            _id: '507f1f77bcf86cd799439011',
            tipo: TipoLocal.CASA_PRAIA,
            nome: 'Casa de Praia 1',
            preco: 500,
          },
        ],
        total: 10,
        limit: 1,
        skip: 2,
      };

      mockLocaisService.listar.mockResolvedValue(mockResultado);

      const query = { limit: 1, skip: 2 };
      const result = await controller.listar(query);

      expect(result.data.limit).toBe(1);
      expect(result.data.skip).toBe(2);
      expect(result.data.total).toBe(10);
    });

    it('deve tratar erros ao listar locais', async () => {
      mockLocaisService.listar.mockRejectedValue(new Error('Erro ao listar'));

      const query = {};

      await expect(controller.listar(query)).rejects.toThrow(HttpException);
    });
  });

  describe('GET /api/locais/:id - buscarPorId', () => {
    it('deve retornar local quando encontrado', async () => {
      const mockLocal = {
        _id: '507f1f77bcf86cd799439011',
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia Encantada',
        preco: 500,
      };

      mockLocaisService.buscarPorId.mockResolvedValue(mockLocal);

      const result = await controller.buscarPorId('507f1f77bcf86cd799439011');

      expect(result).toEqual({
        success: true,
        data: mockLocal,
      });

      expect(mockLocaisService.buscarPorId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('deve lançar erro quando local não encontrado', async () => {
      const notFoundError = new HttpException('Local não encontrado', HttpStatus.NOT_FOUND);
      mockLocaisService.buscarPorId.mockRejectedValue(notFoundError);

      await expect(controller.buscarPorId('507f1f77bcf86cd799439099')).rejects.toThrow(HttpException);
    });

    it('deve validar ID inválido', async () => {
      await expect(controller.buscarPorId('id-invalido')).rejects.toThrow(HttpException);
      expect(mockLocaisService.buscarPorId).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/locais/:id - atualizar', () => {
    it('deve atualizar local existente', async () => {
      const atualizarLocalDto = {
        nome: 'Casa de Praia Atualizada',
        preco: 600,
      };

      const mockLocalAtualizado = {
        _id: '507f1f77bcf86cd799439011',
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia Atualizada',
        preco: 600,
        atualizadoEm: new Date(),
      };

      mockLocaisService.atualizar.mockResolvedValue(mockLocalAtualizado);

      const result = await controller.atualizar('507f1f77bcf86cd799439011', atualizarLocalDto);

      expect(result).toEqual({
        success: true,
        data: mockLocalAtualizado,
      });

      expect(mockLocaisService.atualizar).toHaveBeenCalledWith('507f1f77bcf86cd799439011', atualizarLocalDto);
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const atualizarLocalDto = {
        preco: 700,
      };

      const mockLocalAtualizado = {
        _id: '507f1f77bcf86cd799439011',
        tipo: TipoLocal.CASA_PRAIA,
        nome: 'Casa de Praia Encantada', // Mantido
        preco: 700, // Atualizado
      };

      mockLocaisService.atualizar.mockResolvedValue(mockLocalAtualizado);

      const result = await controller.atualizar('507f1f77bcf86cd799439011', atualizarLocalDto);

      expect(result.data.preco).toBe(700);
    });

    it('deve lançar erro quando local não encontrado para atualizar', async () => {
      const atualizarLocalDto = {
        preco: 600,
      };

      const notFoundError = new HttpException('Local não encontrado', HttpStatus.NOT_FOUND);
      mockLocaisService.atualizar.mockRejectedValue(notFoundError);

      await expect(
        controller.atualizar('507f1f77bcf86cd799439099', atualizarLocalDto),
      ).rejects.toThrow(HttpException);
    });

    it('deve validar ID inválido', async () => {
      const atualizarLocalDto = {
        preco: 600,
      };

      await expect(controller.atualizar('id-invalido', atualizarLocalDto)).rejects.toThrow(HttpException);
      expect(mockLocaisService.atualizar).not.toHaveBeenCalled();
    });
  });
});

