import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoLocal } from '../schemas/local.schema';

export class ListarLocaisDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de local',
    enum: TipoLocal,
    example: TipoLocal.CASA_PRAIA,
  })
  @IsOptional()
  @IsEnum(TipoLocal)
  tipo?: TipoLocal;

  @ApiPropertyOptional({
    description: 'Preço mínimo em reais',
    example: 200,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMin?: number;

  @ApiPropertyOptional({
    description: 'Preço máximo em reais',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMax?: number;

  @ApiPropertyOptional({
    description: 'Latitude para busca por proximidade',
    example: -23.5178,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude para busca por proximidade',
    example: -46.1894,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon?: number;

  @ApiPropertyOptional({
    description: 'Raio em quilômetros para busca por proximidade (obrigatório se lat/lon fornecidos)',
    example: 30,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  raioKm?: number;

  @ApiPropertyOptional({
    description: 'Número máximo de resultados para retornar',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Número de resultados para pular (paginação)',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;
}

