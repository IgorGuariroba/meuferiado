import { Controller, Get, Query, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CidadesService } from './services/cidades.service';
import { BuscarCidadesDto } from './dto/buscar-cidades.dto';
import { ListarCidadesDto } from './dto/listar-cidades.dto';
import { BuscarLocaisDto } from './dto/buscar-locais.dto';
import { TiposLocais } from './dto/tipos-locais.enum';

@ApiTags('cidades')
@Controller('api/cidades')
export class CidadesController {
  constructor(private readonly cidadesService: CidadesService) {}

  @Get()
  @ApiOperation({
    summary: 'Busca cidade atual e cidades vizinhas',
    description: 'Retorna a cidade atual e todas as cidades vizinhas dentro do raio especificado. Pode buscar por coordenadas (lat/lon) ou por nome de cidade/endereço (endereco). É necessário fornecer coordenadas OU endereco, não ambos.'
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    type: Number,
    description: 'Latitude da coordenada central (obrigatório se endereco não for fornecido)',
    example: -23.5178,
  })
  @ApiQuery({
    name: 'lon',
    required: false,
    type: Number,
    description: 'Longitude da coordenada central (obrigatório se endereco não for fornecido)',
    example: -46.1894,
  })
  @ApiQuery({
    name: 'endereco',
    required: false,
    type: String,
    description: 'Nome da cidade ou endereço completo (obrigatório se lat/lon não forem fornecidos). Exemplos: "São Paulo, SP", "Rio de Janeiro, RJ", "Brasília, DF"',
    example: 'São Paulo, SP',
  })
  @ApiQuery({
    name: 'raioKm',
    required: true,
    type: Number,
    description: 'Raio em quilômetros para buscar cidades vizinhas',
    example: 30,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de cidades vizinhas para retornar (padrão: 20, máximo: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de cidades vizinhas para pular na paginação (padrão: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Dados encontrados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            cidadeAtual: {
              type: 'object',
              properties: {
                cidade: { type: 'string', example: 'São Paulo' },
                estado: { type: 'string', example: 'SP' },
                pais: { type: 'string', example: 'BR' },
                endereco_completo: { type: 'string', example: 'São Paulo, SP, Brasil' },
                coordenadas: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number', example: -23.5557714 },
                    lon: { type: 'number', example: -46.6395571 },
                  },
                },
                fonte: { type: 'string', example: 'Google Maps API' },
              },
            },
            cidadesVizinhas: {
              type: 'object',
              properties: {
                cidades: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      nome: { type: 'string', example: 'Osasco' },
                      estado: { type: 'string', example: 'SP' },
                      pais: { type: 'string', example: 'BR' },
                      distancia_km: { type: 'number', example: 18.03 },
                      lat: { type: 'number', example: -23.5557409 },
                      lon: { type: 'number', example: -46.8164283 },
                    },
                  },
                },
                total: { type: 'number', example: 8 },
                limit: { type: 'number', example: 20 },
                skip: { type: 'number', example: 0 },
                fonte: { type: 'string', example: 'Google Maps API' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos - é necessário fornecer coordenadas (lat e lon) OU um endereco' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async obterCidades(@Query() query: any) {
    try {
      // Validar raioKm primeiro (sempre obrigatório)
      const raioKm = query.raioKm ? Number(query.raioKm) : null;
      if (!raioKm || isNaN(raioKm) || raioKm < 1 || raioKm > 1000) {
        throw new HttpException(
          {
            success: false,
            message: 'raioKm é obrigatório e deve ser um número entre 1 e 1000',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const endereco = query.endereco ? String(query.endereco).trim() : null;
      const lat = query.lat !== undefined ? Number(query.lat) : undefined;
      const lon = query.lon !== undefined ? Number(query.lon) : undefined;

      // Validar que temos coordenadas OU endereco
      if (!endereco && (lat === undefined || lon === undefined)) {
        throw new HttpException(
          {
            success: false,
            message: 'É necessário fornecer coordenadas (lat e lon) OU um endereco',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar coordenadas se fornecidas
      if (!endereco) {
        if (isNaN(lat!) || lat! < -90 || lat! > 90) {
          throw new HttpException(
            {
              success: false,
              message: 'lat deve ser um número entre -90 e 90',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        if (isNaN(lon!) || lon! < -180 || lon! > 180) {
          throw new HttpException(
            {
              success: false,
              message: 'lon deve ser um número entre -180 e 180',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Se foi fornecido endereco, buscar coordenadas primeiro
      let latFinal: number;
      let lonFinal: number;
      let cidadeAtualPorEndereco: any = null;

      if (endereco) {
        // Buscar coordenadas por endereço
        const resultadoEndereco = await this.cidadesService.buscarCoordenadasPorEndereco(endereco);
        latFinal = resultadoEndereco.coordenadas.lat;
        lonFinal = resultadoEndereco.coordenadas.lon;
        cidadeAtualPorEndereco = {
          cidade: resultadoEndereco.cidade,
          estado: resultadoEndereco.estado,
          pais: resultadoEndereco.pais,
          endereco_completo: resultadoEndereco.endereco_completo,
          coordenadas: resultadoEndereco.coordenadas,
          doMongoDB: false, // Vem da API
        };
      } else {
        latFinal = lat as number;
        lonFinal = lon as number;
      }

      // Transformar limit e skip manualmente se fornecidos
      const limitNum = query.limit !== undefined && query.limit !== null
        ? (typeof query.limit === 'string' ? parseInt(query.limit, 10) : Number(query.limit))
        : undefined;
      const skipNum = query.skip !== undefined && query.skip !== null
        ? (typeof query.skip === 'string' ? parseInt(query.skip, 10) : Number(query.skip))
        : undefined;

      // Validar limit e skip se fornecidos
      if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 1 || limitNum > 100)) {
        throw new HttpException(
          {
            success: false,
            message: 'Limit deve ser um número entre 1 e 100',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (skipNum !== undefined && (isNaN(skipNum) || skipNum < 0)) {
        throw new HttpException(
          {
            success: false,
            message: 'Skip deve ser um número maior ou igual a 0',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Buscar cidade atual e cidades vizinhas
      // Se já temos cidade atual do endereço, não precisa buscar novamente
      const [cidadeAtual, resultadoVizinhas] = await Promise.all([
        cidadeAtualPorEndereco
          ? Promise.resolve(cidadeAtualPorEndereco)
          : this.cidadesService.obterCidadeAtual(latFinal, lonFinal),
        this.cidadesService.obterCidadesVizinhas(latFinal, lonFinal, raioKm, limitNum, skipNum),
      ]);

      return {
        success: true,
        data: {
          cidadeAtual: {
            ...cidadeAtual,
            fonte: cidadeAtual.doMongoDB ? 'MongoDB' : 'Google Maps API',
          },
          cidadesVizinhas: {
            cidades: resultadoVizinhas.cidades,
            total: resultadoVizinhas.total,
            limit: resultadoVizinhas.limit,
            skip: resultadoVizinhas.skip,
            fonte: resultadoVizinhas.doMongoDB ? 'MongoDB' : 'Google Maps API',
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar cidades',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('listar')
  @ApiOperation({
    summary: 'Lista todas as cidades salvas no MongoDB',
    description: 'Retorna todas as cidades armazenadas no banco de dados com opção de paginação'
  })
  @ApiResponse({ status: 200, description: 'Lista de cidades retornada com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async listarCidades(
    @Query(new ValidationPipe({ whitelist: true, transform: true })) query: ListarCidadesDto,
  ) {
    try {
      const resultado = await this.cidadesService.listarTodasCidades(query.limit, query.skip);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao listar cidades',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('locais')
  @ApiOperation({
    summary: 'Busca locais em uma cidade',
    description: 'Busca locais (chalés, pousadas, restaurantes, etc.) em uma cidade específica usando Google Places API'
  })
  @ApiQuery({
    name: 'query',
    required: true,
    enum: TiposLocais,
    description: 'Termo de busca para o tipo de local',
    example: TiposLocais.CHALE,
  })
  @ApiQuery({
    name: 'city',
    required: true,
    type: String,
    description: 'Nome da cidade onde buscar os locais',
    example: 'Campos do Jordão',
  })
  @ApiResponse({
    status: 200,
    description: 'Locais encontrados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string', example: 'Chalé da Montanha' },
              endereco: { type: 'string', example: 'Rua das Flores, 123, Campos do Jordão, SP' },
              coordenadas: {
                type: 'object',
                properties: {
                  lat: { type: 'number', example: -22.7394 },
                  lon: { type: 'number', example: -45.5914 },
                },
              },
              rating: { type: 'number', example: 4.5 },
              total_avaliacoes: { type: 'number', example: 120 },
              tipos: { type: 'array', items: { type: 'string' }, example: ['lodging', 'point_of_interest'] },
              place_id: { type: 'string', example: 'ChIJ...' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos - query e city são obrigatórios' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarLocais(
    @Query(new ValidationPipe({ whitelist: true, transform: true })) query: BuscarLocaisDto,
  ) {
    try {
      if (!query.query || !query.city) {
        throw new HttpException(
          {
            success: false,
            message: 'query e city são obrigatórios',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const locais = await this.cidadesService.buscarLocaisPorCidade(query.query, query.city);

      return {
        success: true,
        data: locais,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar locais',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

