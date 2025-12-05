import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocaisController } from './locais.controller';
import { LocaisService } from './services/locais.service';
import { Local, LocalSchema } from './schemas/local.schema';
import { CidadesModule } from '../cidades/cidades.module';
import { Cidade, CidadeSchema } from '../cidades/schemas/cidade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Local.name, schema: LocalSchema },
      { name: Cidade.name, schema: CidadeSchema },
    ]),
    CidadesModule,
  ],
  controllers: [LocaisController],
  providers: [LocaisService],
  exports: [LocaisService],
})
export class LocaisModule {}

