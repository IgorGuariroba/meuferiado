import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CriarTermoBuscaDto {
  @ApiProperty({
    description: 'Termo de busca (ex: "chalé", "cabana", "pousada")',
    example: 'chalé',
  })
  @IsString()
  @IsNotEmpty()
  termo: string;

  @ApiPropertyOptional({
    description: 'Descrição do termo (opcional)',
    example: 'Chalés e casas de campo',
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Se o termo está ativo (padrão: true)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

