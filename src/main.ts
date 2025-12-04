import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validação será feita por rota quando necessário

  // Habilitar CORS
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Aplicação rodando em http://localhost:${port}`);
  console.log(`📚 API disponível em http://localhost:${port}/api`);
}

bootstrap();

