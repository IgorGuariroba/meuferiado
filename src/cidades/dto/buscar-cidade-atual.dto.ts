import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarCidadeAtualDto {
  @ApiProperty({
    description: 'Latitude da coordenada',
    example: -23.5178,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude da coordenada',
    example: -46.1894,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lon: number;
}

