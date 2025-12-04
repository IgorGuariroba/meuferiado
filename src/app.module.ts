import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CidadesModule } from './cidades/cidades.module';

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
  ],
})
export class AppModule {}

