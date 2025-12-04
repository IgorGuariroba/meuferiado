import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CidadesController } from './cidades.controller';
import { CidadesService } from './services/cidades.service';
import { GoogleMapsService } from './services/google-maps.service';
import { Cidade, CidadeSchema } from './schemas/cidade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cidade.name, schema: CidadeSchema }]),
  ],
  controllers: [CidadesController],
  providers: [CidadesService, GoogleMapsService],
})
export class CidadesModule {}

