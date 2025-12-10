import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarLocaisSalvosDto {
  @ApiProperty({
    description: 'Nome da cidade para buscar os locais salvos',
    example: 'Mogi das Cruzes',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Estado da cidade (opcional, ajuda a identificar a cidade corretamente)',
    example: 'SP',
    required: false,
  })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({
    description: 'Número máximo de locais para retornar (padrão: 50, máximo: 100)',
    example: 50,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: 'Número de locais para pular na paginação (padrão: 0)',
    example: 0,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @ApiProperty({
    description: 'Filtrar locais por nome (busca parcial, case-insensitive)',
    example: 'Camping Refúgio',
    required: false,
  })
  @IsString()
  @IsOptional()
  nome?: string;
}

