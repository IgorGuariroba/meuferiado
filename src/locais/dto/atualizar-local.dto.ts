import { IsEnum, IsString, IsNumber, IsOptional, IsArray, Min, Max, IsEmail, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoLocal } from '../schemas/local.schema';

export class AtualizarContatoDto {
  @ApiPropertyOptional({
    description: 'Telefone de contato',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({
    description: 'Email de contato',
    example: 'contato@exemplo.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class AtualizarLocalDto {
  @ApiPropertyOptional({
    description: 'Tipo do local de hospedagem',
    enum: TipoLocal,
  })
  @IsOptional()
  @IsEnum(TipoLocal)
  tipo?: TipoLocal;

  @ApiPropertyOptional({
    description: 'Nome do local',
    example: 'Casa de Praia Encantada',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Descrição do local',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Endereço completo do local',
  })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({
    description: 'Latitude',
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
    description: 'Longitude',
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
    description: 'Preço diário em reais',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preco?: number;

  @ApiPropertyOptional({
    description: 'Array de URLs das imagens do local',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imagens?: string[];

  @ApiPropertyOptional({
    description: 'Informações de contato',
    type: AtualizarContatoDto,
  })
  @IsOptional()
  @Type(() => AtualizarContatoDto)
  contato?: AtualizarContatoDto;

  @ApiPropertyOptional({
    description: 'Lista de comodidades disponíveis',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  comodidades?: string[];

  @ApiPropertyOptional({
    description: 'Avaliação do local (0 a 5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  avaliacao?: number;
}

