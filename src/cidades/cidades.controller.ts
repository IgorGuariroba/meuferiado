import { Controller, Get, Post, Delete, Query, Body, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CidadesService } from './services/cidades.service';
import { BuscarCidadesDto } from './dto/buscar-cidades.dto';
import { ListarCidadesDto } from './dto/listar-cidades.dto';
import { BuscarLocaisDto } from './dto/buscar-locais.dto';
import { BuscarLocaisSalvosDto } from './dto/buscar-locais-salvos.dto';
import { CriarTermoBuscaDto } from './dto/criar-termo-busca.dto';
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
    example: 'Mogi das Cruzes',
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
              nome: { type: 'string', example: 'Chalé Conforto' },
              endereco: { type: 'string', example: 'Estr. Manoel Ferreira, s/n - Manoel Ferreira, Mogi das Cruzes - SP, 08700-000, Brasil' },
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

  @Get('locais-salvos')
  @ApiOperation({
    summary: 'Busca locais salvos no MongoDB por cidade',
    description: 'Retorna todos os locais salvos no banco de dados para uma cidade específica. Busca apenas no MongoDB, não faz requisições à API do Google.'
  })
  @ApiQuery({
    name: 'city',
    required: true,
    type: String,
    description: 'Nome da cidade para buscar os locais salvos',
    example: 'Mogi das Cruzes',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    type: String,
    description: 'Estado da cidade (opcional, ajuda a identificar a cidade corretamente)',
    example: 'SP',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de locais para retornar (padrão: 50, máximo: 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de locais para pular na paginação (padrão: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Locais salvos encontrados com sucesso',
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
                  id: { type: 'string', example: '69385d67345b652f14567483' },
                  tipo: { type: 'string', example: 'chale' },
                  nome: { type: 'string', example: 'Chalé Conforto' },
                  descricao: { type: 'string', example: 'Local encontrado em Mogi das Cruzes' },
                  endereco: { type: 'string', example: 'Estr. Manoel Ferreira, s/n - Manoel Ferreira, Mogi das Cruzes - SP' },
                  formatted_address: { type: 'string', example: 'Estr. Manoel Ferreira, s/n - Manoel Ferreira, Mogi das Cruzes - SP, 08700-000, Brazil' },
                  coordenadas: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', example: -23.675528 },
                      lon: { type: 'number', example: -46.094111 },
                    },
                  },
                  preco: { type: 'number', example: 150 },
                  avaliacao: { type: 'number', example: 4.8 },
                  place_id: { type: 'string', example: 'ChIJ8_PWhVjmzZQRwVSFsm_xXiM' },
                  photos: { type: 'array', items: { type: 'object' } },
                  formatted_phone_number: { type: 'string', example: '(11) 94259-4723' },
                  website: { type: 'string', example: 'https://chaleconforto.wixsite.com/chale' },
                  url: { type: 'string', example: 'https://maps.google.com/?cid=...' },
                  opening_hours: { type: 'array', items: { type: 'string' } },
                  current_opening_hours: { type: 'object' },
                  open_now: { type: 'boolean', example: false },
                  reviews: { type: 'array', items: { type: 'object' } },
                  address_components: { type: 'array', items: { type: 'object' } },
                  business_status: { type: 'string', example: 'OPERATIONAL' },
                  criadoEm: { type: 'string', example: '2025-12-09T17:33:27.000Z' },
                  atualizadoEm: { type: 'string', example: '2025-12-09T18:01:21.000Z' },
                },
              },
            },
            total: { type: 'number', example: 2 },
            cidade: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '69385d67345b652f145674a5' },
                nome: { type: 'string', example: 'Mogi das Cruzes' },
                estado: { type: 'string', example: 'SP' },
                pais: { type: 'string', example: 'BR' },
              },
            },
            limit: { type: 'number', example: 50 },
            skip: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos - city é obrigatório' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarLocaisSalvos(
    @Query(new ValidationPipe({ whitelist: true, transform: true })) query: BuscarLocaisSalvosDto,
  ) {
    try {
      if (!query.city) {
        throw new HttpException(
          {
            success: false,
            message: 'city é obrigatório',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar limit e skip
      const limit = query.limit ? Math.min(Math.max(1, query.limit), 100) : 50;
      const skip = query.skip ? Math.max(0, query.skip) : 0;

      const resultado = await this.cidadesService.buscarLocaisSalvosPorCidade(
        query.city,
        query.estado,
        limit,
        skip,
      );

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar locais salvos',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('locais-salvos/atualizar')
  @ApiOperation({
    summary: 'Atualiza locais salvos que não têm detalhes completos',
    description: 'Busca e atualiza locais existentes no MongoDB que não têm photos, reviews, telefone ou website. Útil para atualizar locais salvos antes da implementação dos detalhes completos.'
  })
  @ApiQuery({
    name: 'city',
    required: true,
    type: String,
    description: 'Nome da cidade',
    example: 'Mogi das Cruzes',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    type: String,
    description: 'Estado da cidade',
    example: 'SP',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de locais para atualizar (padrão: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Locais atualizados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            atualizados: { type: 'number', example: 2 },
            erros: { type: 'number', example: 0 },
            locais: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nome: { type: 'string' },
                  place_id: { type: 'string' },
                  atualizado: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async atualizarLocaisSemDetalhes(
    @Query('city') city: string,
    @Query('estado') estado?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      if (!city) {
        throw new HttpException(
          {
            success: false,
            message: 'city é obrigatório',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const limitNum = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 20) : 10;

      const resultado = await this.cidadesService.atualizarLocaisSemDetalhes(
        city,
        estado,
        limitNum,
      );

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar locais',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('locais-salvos')
  @ApiOperation({
    summary: 'Exclui locais salvos no MongoDB',
    description: 'Exclui locais salvos de uma cidade. Pode excluir todos os locais da cidade ou um local específico por place_id.'
  })
  @ApiQuery({
    name: 'city',
    required: true,
    type: String,
    description: 'Nome da cidade',
    example: 'Mogi das Cruzes',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    type: String,
    description: 'Estado da cidade (opcional, ajuda a identificar a cidade corretamente)',
    example: 'SP',
  })
  @ApiQuery({
    name: 'place_id',
    required: false,
    type: String,
    description: 'Place ID do local específico a ser excluído (opcional). Se não fornecido, exclui todos os locais da cidade.',
    example: 'ChIJ8_PWhVjmzZQRwVSFsm_xXiM',
  })
  @ApiResponse({
    status: 200,
    description: 'Locais excluídos com sucesso (soft delete)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            excluidos: { type: 'number', example: 2 },
            cidade: {
              type: 'object',
              properties: {
                nome: { type: 'string', example: 'Mogi das Cruzes' },
                estado: { type: 'string', example: 'SP' },
                pais: { type: 'string', example: 'BR' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Local específico excluído com sucesso (soft delete quando place_id é fornecido)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            excluidos: { type: 'number', example: 1 },
            local: {
              type: 'object',
              properties: {
                nome: { type: 'string', example: 'Chalé Conforto' },
                place_id: { type: 'string', example: 'ChIJ8_PWhVjmzZQRwVSFsm_xXiM' },
                deletedAt: { type: 'string', format: 'date-time', example: '2025-12-14T10:30:00.000Z' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos - city é obrigatório' })
  @ApiResponse({ status: 404, description: 'Cidade ou local não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async excluirLocaisSalvos(
    @Query('city') city: string,
    @Query('estado') estado?: string,
    @Query('place_id') placeId?: string,
  ) {
    try {
      if (!city) {
        throw new HttpException(
          {
            success: false,
            message: 'city é obrigatório',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.cidadesService.excluirLocaisSalvos(
        city,
        estado,
        placeId,
      );

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      const statusCode = error.message.includes('não encontrado')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao excluir locais',
        },
        statusCode,
      );
    }
  }

  @Get('foto')
  @ApiOperation({
    summary: 'Gera URL para visualizar foto do Google Places',
    description: 'Retorna a URL direta para visualizar uma foto usando o photo_reference retornado pela API.'
  })
  @ApiQuery({
    name: 'photo_reference',
    required: true,
    type: String,
    description: 'O photo_reference completo retornado pela API (ex: "places/ChIJ.../photos/...")',
    example: 'places/ChIJ8_PWhVjmzZQRwVSFsm_xXiM/photos/AZLasHotBrxY5xDRjB3wsmCCzCTOX1Oh74u_PBt9QiUV8MCEOqQZRgAMI40ehGofV5emAJ6IDt7mR-YH3-7dc13jp-p-wOi6MQmczqb-p-mKLYl1JUHx23qGqR4I3uNCUpgaN3KoOiuu8gij2zO3W6raTB7y6A1W_JvrEfflF4-StlSEsIg5dQysyJhvLSFcn7JiuhPch-BR6RIbiSigvXYBVbBFxlfrc4Ob5Xqn3w8XVFwzAcRDyWChby9-C5PNIAwuMToecR1457_vyZHU0S4au60_YgneTdBR7TIM2yfyaMG-zWVJwrEV9JudY5Z2vzNdaEyv38eGvijXpj71CDV_t_wbC8SdmTJtOwMY7LEyT5s5eE15xGlur5plfENkEuLVp92wtlbDNsIAOcflAi_RssAFq2CFuGPBxdiC_GwUjxc',
  })
  @ApiQuery({
    name: 'maxWidth',
    required: false,
    type: Number,
    description: 'Largura máxima da imagem em pixels (padrão: 800)',
    example: 800,
  })
  @ApiQuery({
    name: 'maxHeight',
    required: false,
    type: Number,
    description: 'Altura máxima da imagem em pixels (padrão: 600)',
    example: 600,
  })
  @ApiResponse({
    status: 200,
    description: 'URL da foto gerada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: 'https://places.googleapis.com/v1/places/ChIJ8_PWhVjmzZQRwVSFsm_xXiM/photos/AZLasHotBrxY5xDRjB3wsmCCzCTOX1Oh74u_PBt9QiUV8MCEOqQZRgAMI40ehGofV5emAJ6IDt7mR-YH3-7dc13jp-p-wOi6MQmczqb-p-mKLYl1JUHx23qGqR4I3uNCUpgaN3KoOiuu8gij2zO3W6raTB7y6A1W_JvrEfflF4-StlSEsIg5dQysyJhvLSFcn7JiuhPch-BR6RIbiSigvXYBVbBFxlfrc4Ob5Xqn3w8XVFwzAcRDyWChby9-C5PNIAwuMToecR1457_vyZHU0S4au60_YgneTdBR7TIM2yfyaMG-zWVJwrEV9JudY5Z2vzNdaEyv38eGvijXpj71CDV_t_wbC8SdmTJtOwMY7LEyT5s5eE15xGlur5plfENkEuLVp92wtlbDNsIAOcflAi_RssAFq2CFuGPBxdiC_GwUjxc/media?maxHeightPx=600&maxWidthPx=800&key=YOUR_API_KEY'
            },
            photo_reference: { type: 'string' },
            maxWidth: { type: 'number', example: 800 },
            maxHeight: { type: 'number', example: 600 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'photo_reference é obrigatório' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async gerarUrlFoto(
    @Query('photo_reference') photoReference: string,
    @Query('maxWidth') maxWidth?: string,
    @Query('maxHeight') maxHeight?: string,
  ) {
    try {
      if (!photoReference) {
        throw new HttpException(
          {
            success: false,
            message: 'photo_reference é obrigatório',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const width = maxWidth ? parseInt(maxWidth, 10) : 800;
      const height = maxHeight ? parseInt(maxHeight, 10) : 600;

      const url = this.cidadesService.gerarUrlFoto(photoReference, width, height);

      if (!url) {
        throw new HttpException(
          {
            success: false,
            message: 'Não foi possível gerar a URL da foto. Verifique se o photo_reference está no formato correto.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        success: true,
        data: {
          url,
          photo_reference: photoReference,
          maxWidth: width,
          maxHeight: height,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao gerar URL da foto',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('termos-busca')
  @ApiOperation({
    summary: 'Lista todos os termos de busca disponíveis',
    description: 'Retorna todos os termos de busca que podem ser usados na rota /api/cidades/locais'
  })
  @ApiQuery({
    name: 'ativo',
    required: false,
    type: Boolean,
    description: 'Filtrar apenas termos ativos (true) ou inativos (false). Se não fornecido, retorna todos.',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de termos de busca retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            termos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  termo: { type: 'string', example: 'chalé' },
                  descricao: { type: 'string', example: 'Chalés e casas de campo' },
                  ativo: { type: 'boolean', example: true },
                  criadoEm: { type: 'string', format: 'date-time' },
                  atualizadoEm: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'number', example: 67 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async listarTermosBusca(
    @Query('ativo') ativo?: string,
  ) {
    try {
      const ativoBoolean = ativo === 'true' ? true : ativo === 'false' ? false : undefined;
      const resultado = await this.cidadesService.listarTermosBusca(ativoBoolean);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao listar termos de busca',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('termos-busca')
  @ApiOperation({
    summary: 'Adiciona um novo termo de busca',
    description: 'Adiciona um novo termo que pode ser usado na rota /api/cidades/locais'
  })
  @ApiBody({
    type: CriarTermoBuscaDto,
    description: 'Dados do termo de busca a ser criado',
  })
  @ApiResponse({
    status: 201,
    description: 'Termo de busca criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            termo: { type: 'string', example: 'chalé' },
            descricao: { type: 'string', example: 'Chalés e casas de campo' },
            ativo: { type: 'boolean', example: true },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou termo já existe' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async criarTermoBusca(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) criarTermoBuscaDto: CriarTermoBuscaDto,
  ) {
    try {
      const termo = await this.cidadesService.criarTermoBusca(
        criarTermoBuscaDto.termo,
        criarTermoBuscaDto.descricao,
        criarTermoBuscaDto.ativo !== undefined ? criarTermoBuscaDto.ativo : true,
      );

      return {
        success: true,
        data: termo,
      };
    } catch (error) {
      const statusCode = error.message.includes('já existe')
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar termo de busca',
        },
        statusCode,
      );
    }
  }

  @Delete('termos-busca')
  @ApiOperation({
    summary: 'Exclui um termo de busca',
    description: 'Remove um termo de busca da lista de termos disponíveis'
  })
  @ApiQuery({
    name: 'termo',
    required: true,
    type: String,
    description: 'O termo a ser excluído (ex: "chalé", "cabana")',
    example: 'chalé',
  })
  @ApiResponse({
    status: 200,
    description: 'Termo de busca excluído com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            termo: { type: 'string', example: 'chalé' },
            excluido: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'termo é obrigatório' })
  @ApiResponse({ status: 404, description: 'Termo não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async excluirTermoBusca(
    @Query('termo') termo: string,
  ) {
    try {
      if (!termo) {
        throw new HttpException(
          {
            success: false,
            message: 'termo é obrigatório',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.cidadesService.excluirTermoBusca(termo);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      const statusCode = error.message.includes('não encontrado')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao excluir termo de busca',
        },
        statusCode,
      );
    }
  }
}

