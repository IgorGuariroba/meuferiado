import { Controller, Get, Query, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { CidadesService } from './services/cidades.service';
import { BuscarCidadesDto } from './dto/buscar-cidades.dto';
import { BuscarCidadeAtualDto } from './dto/buscar-cidade-atual.dto';

@Controller('api/cidades')
export class CidadesController {
  constructor(private readonly cidadesService: CidadesService) {}

  @Get('atual')
  async obterCidadeAtual(@Query(new ValidationPipe({ whitelist: true, transform: true })) query: BuscarCidadeAtualDto) {
    try {
      const { lat, lon } = query;
      const cidade = await this.cidadesService.obterCidadeAtual(lat, lon);
      return {
        success: true,
        data: cidade,
        fonte: cidade.doMongoDB ? 'MongoDB' : 'Google Maps API',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar cidade atual',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vizinhas')
  async obterCidadesVizinhas(@Query(new ValidationPipe({ whitelist: true, transform: true })) query: BuscarCidadesDto) {
    try {
      const { lat, lon, raioKm } = query;
      const resultado = await this.cidadesService.obterCidadesVizinhas(lat, lon, raioKm);
      return {
        success: true,
        data: resultado.cidades,
        total: resultado.cidades.length,
        fonte: resultado.doMongoDB ? 'MongoDB' : 'Google Maps API',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar cidades vizinhas',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

