import { Controller, Get, Query, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CidadesService } from './services/cidades.service';
import { BuscarCidadesDto } from './dto/buscar-cidades.dto';
import { ListarCidadesDto } from './dto/listar-cidades.dto';

@ApiTags('cidades')
@Controller('api/cidades')
export class CidadesController {
  constructor(private readonly cidadesService: CidadesService) {}

  @Get()
  @ApiOperation({
    summary: 'Busca cidade atual e cidades vizinhas',
    description: 'Retorna a cidade atual para as coordenadas fornecidas e todas as cidades vizinhas dentro do raio especificado'
  })
  @ApiResponse({ status: 200, description: 'Dados encontrados com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async obterCidades(@Query(new ValidationPipe({ whitelist: true, transform: true })) query: BuscarCidadesDto) {
    try {
      const { lat, lon, raioKm } = query;

      // Transformar limit e skip manualmente se fornecidos (podem vir como string ou number)
      const limitNum = query.limit !== undefined && query.limit !== null
        ? (typeof query.limit === 'string' ? parseInt(query.limit, 10) : query.limit)
        : undefined;
      const skipNum = query.skip !== undefined && query.skip !== null
        ? (typeof query.skip === 'string' ? parseInt(query.skip, 10) : query.skip)
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

      // Buscar cidade atual e cidades vizinhas em paralelo
      const [cidadeAtual, resultadoVizinhas] = await Promise.all([
        this.cidadesService.obterCidadeAtual(lat, lon),
        this.cidadesService.obterCidadesVizinhas(lat, lon, raioKm, limitNum, skipNum),
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
        HttpStatus.INTERNAL_SERVER_ERROR,
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
}

