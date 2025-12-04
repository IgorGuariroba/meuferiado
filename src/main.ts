import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validação será feita por rota quando necessário

  // Habilitar CORS
  app.enableCors();

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Cidades Vizinhas')
    .setDescription('API para buscar cidade atual e cidades vizinhas usando coordenadas geográficas, Google Maps Geocoding API e MongoDB')
    .setVersion('1.0')
    .addTag('cidades', 'Endpoints para buscar informações sobre cidades')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Aplicação rodando em http://localhost:${port}`);
  console.log(`📚 API disponível em http://localhost:${port}/api`);
  console.log(`📖 Swagger disponível em http://localhost:${port}/docs`);
}

bootstrap();

