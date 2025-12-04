import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarCidadesDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lon: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  raioKm: number;
}

