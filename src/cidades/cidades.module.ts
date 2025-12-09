import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CidadesController } from './cidades.controller';
import { CidadesService } from './services/cidades.service';
import { GoogleMapsService } from './services/google-maps.service';
import { Cidade, CidadeSchema } from './schemas/cidade.schema';
import { Local, LocalSchema } from '../locais/schemas/local.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cidade.name, schema: CidadeSchema },
      { name: Local.name, schema: LocalSchema },
    ]),
  ],
  controllers: [CidadesController],
  providers: [CidadesService, GoogleMapsService],
  exports: [CidadesService, GoogleMapsService],
})
export class CidadesModule {}

