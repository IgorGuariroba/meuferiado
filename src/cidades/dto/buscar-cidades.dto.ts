import { IsNumber, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuscarCidadesDto {
  @ApiProperty({
    description: 'Latitude da coordenada central',
    example: -23.5178,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude da coordenada central',
    example: -46.1894,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  lon: number;

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

