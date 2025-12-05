import { Controller, Get, Post, Patch, Param, Body, Query, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LocaisService } from './services/locais.service';
import { CriarLocalDto } from './dto/criar-local.dto';
import { AtualizarLocalDto } from './dto/atualizar-local.dto';
import { ListarLocaisDto } from './dto/listar-locais.dto';
import { TipoLocal } from './schemas/local.schema';

@ApiTags('locais')
@Controller('api/locais')
export class LocaisController {
  constructor(private readonly locaisService: LocaisService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo local de hospedagem',
    description: 'Cria um novo local de hospedagem. Se apenas o endereço for fornecido, as coordenadas serão obtidas automaticamente via Geocoding API. O local será relacionado com uma cidade existente se encontrada próxima.',
  })
  @ApiResponse({
    status: 201,
    description: 'Local criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            tipo: { type: 'string', example: 'casa_praia' },
            nome: { type: 'string', example: 'Casa de Praia Encantada' },
            descricao: { type: 'string' },
            endereco: { type: 'string', example: 'Rua das Praias, 123, Praia Grande, SP' },
            localizacao: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [-46.1894, -23.5178] },
              },
            },
            preco: { type: 'number', example: 500 },
            imagens: { type: 'array', items: { type: 'string' } },
            contato: {
              type: 'object',
              properties: {
                telefone: { type: 'string' },
                email: { type: 'string' },
              },
            },
            comodidades: { type: 'array', items: { type: 'string' } },
            avaliacao: { type: 'number', example: 4.5 },
            cidade: { type: 'string' },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async criar(@Body(new ValidationPipe({ whitelist: true, transform: true })) criarLocalDto: CriarLocalDto) {
    try {
      const local = await this.locaisService.criar(criarLocalDto);
      return {
        success: true,
        data: local,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar local',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Listar locais de hospedagem',
    description: 'Lista locais de hospedagem com filtros opcionais por tipo, preço e localização. Suporta paginação e ordenação por distância (se coordenadas fornecidas) ou por preço.',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: TipoLocal,
    description: 'Filtrar por tipo de local',
  })
  @ApiQuery({
    name: 'precoMin',
    required: false,
    type: Number,
    description: 'Preço mínimo em reais',
  })
  @ApiQuery({
    name: 'precoMax',
    required: false,
    type: Number,
    description: 'Preço máximo em reais',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    type: Number,
    description: 'Latitude para busca por proximidade',
  })
  @ApiQuery({
    name: 'lon',
    required: false,
    type: Number,
    description: 'Longitude para busca por proximidade',
  })
  @ApiQuery({
    name: 'raioKm',
    required: false,
    type: Number,
    description: 'Raio em quilômetros para busca por proximidade',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de resultados (padrão: 20)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de resultados para pular (paginação)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de locais retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            locais: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  tipo: { type: 'string' },
                  nome: { type: 'string' },
                  descricao: { type: 'string' },
                  endereco: { type: 'string' },
                  localizacao: { type: 'object' },
                  preco: { type: 'number' },
                  imagens: { type: 'array', items: { type: 'string' } },
                  contato: { type: 'object' },
                  comodidades: { type: 'array', items: { type: 'string' } },
                  avaliacao: { type: 'number' },
                  distancia_km: { type: 'number', description: 'Presente apenas se busca por proximidade' },
                  criadoEm: { type: 'string', format: 'date-time' },
                  atualizadoEm: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'number', example: 50 },
            limit: { type: 'number', example: 20 },
            skip: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async listar(@Query(new ValidationPipe({ whitelist: true, transform: true })) listarLocaisDto: ListarLocaisDto) {
    try {
      const resultado = await this.locaisService.listar(listarLocaisDto);
      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao listar locais',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar local por ID',
    description: 'Retorna os detalhes de um local específico pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do local (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Local encontrado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Local não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarPorId(@Param('id') id: string) {
    // Validar se é um ObjectId válido
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        {
          success: false,
          message: 'ID inválido',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const local = await this.locaisService.buscarPorId(id);
      return {
        success: true,
        data: local,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar local',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar local de hospedagem',
    description: 'Atualiza um local existente. Apenas os campos fornecidos serão atualizados. Se endereço ou coordenadas forem atualizados, o relacionamento com cidade será recalculado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do local (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Local atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Local não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async atualizar(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) atualizarLocalDto: AtualizarLocalDto,
  ) {
    // Validar se é um ObjectId válido
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        {
          success: false,
          message: 'ID inválido',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const local = await this.locaisService.atualizar(id, atualizarLocalDto);
      return {
        success: true,
        data: local,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar local',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

