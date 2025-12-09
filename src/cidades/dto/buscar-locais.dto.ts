import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarLocaisDto {
  @ApiProperty({
    description: 'Termo de busca para o tipo de local (ex: chalés, pousadas, restaurantes)',
    example: 'chalés',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'Nome da cidade onde buscar os locais',
    example: 'Campos do Jordão',
  })
  @IsString()
  @IsNotEmpty()
  city: string;
}

