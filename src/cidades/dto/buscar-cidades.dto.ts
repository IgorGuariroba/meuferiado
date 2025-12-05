import { IsNumber, Min, Max, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuscarCidadesDto {
  @ApiPropertyOptional({
    description: 'Latitude da coordenada central (obrigatório se endereco não for fornecido)',
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
    description: 'Longitude da coordenada central (obrigatório se endereco não for fornecido)',
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
    description: 'Nome da cidade ou endereço (obrigatório se lat/lon não forem fornecidos)',
    example: 'São Paulo, SP',
  })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({
    description: 'Raio em quilômetros para buscar cidades vizinhas',
    example: 30,
    minimum: 1,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(1000)
  raioKm: number;

  @ApiPropertyOptional({
    description: 'Número máximo de cidades vizinhas para retornar',
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
    description: 'Número de cidades vizinhas para pular (paginação)',
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

