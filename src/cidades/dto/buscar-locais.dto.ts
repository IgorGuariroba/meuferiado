import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarLocaisDto {
  @ApiProperty({
    description: 'Termo de busca para o tipo de local',
    type: String,
    example: 'chalé',
  })
  @IsString()
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

