import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TiposLocais } from './tipos-locais.enum';

export class BuscarLocaisDto {
  @ApiProperty({
    description: 'Termo de busca para o tipo de local',
    enum: TiposLocais,
    example: TiposLocais.CHALE,
  })
  @IsEnum(TiposLocais)
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'Nome da cidade onde buscar os locais',
    example: 'Mogi das Cruzes',
  })
  @IsString()
  @IsNotEmpty()
  city: string;
}

