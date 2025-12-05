import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CidadesModule } from './cidades/cidades.module';
import { LocaisModule } from './locais/locais.module';
import { CommandsModule } from './commands/commands.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/cidades?authSource=admin',
    ),
    CidadesModule,
    LocaisModule,
    CommandsModule,
  ],
})
export class AppModule {}

