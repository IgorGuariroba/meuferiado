import { IsEnum, IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min, Max, ValidateIf, IsEmail, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoLocal } from '../schemas/local.schema';

export class ContatoDto {
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

export class CriarLocalDto {
  @ApiProperty({
    description: 'Tipo do local de hospedagem',
    enum: TipoLocal,
    example: TipoLocal.CASA_PRAIA,
  })
  @IsEnum(TipoLocal)
  @IsNotEmpty()
  tipo: TipoLocal;

  @ApiProperty({
    description: 'Nome do local',
    example: 'Casa de Praia Encantada',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição do local',
    example: 'Linda casa de praia com vista para o mar, 3 quartos, piscina e área de lazer completa',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Endereço completo do local',
    example: 'Rua das Praias, 123, Praia Grande, SP',
  })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiPropertyOptional({
    description: 'Latitude (obrigatório se endereco não for fornecido ou para precisão)',
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
    description: 'Longitude (obrigatório se endereco não for fornecido ou para precisão)',
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

  @ApiProperty({
    description: 'Preço diário em reais',
    example: 500,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  preco: number;

  @ApiPropertyOptional({
    description: 'Array de URLs das imagens do local',
    example: ['https://exemplo.com/imagem1.jpg', 'https://exemplo.com/imagem2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imagens?: string[];

  @ApiPropertyOptional({
    description: 'Informações de contato',
    type: ContatoDto,
  })
  @IsOptional()
  @Type(() => ContatoDto)
  contato?: ContatoDto;

  @ApiPropertyOptional({
    description: 'Lista de comodidades disponíveis',
    example: ['piscina', 'wifi', 'ar_condicionado', 'churrasqueira'],
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

