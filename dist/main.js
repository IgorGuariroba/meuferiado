"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('API de Cidades Vizinhas e Locais de Hospedagem')
        .setDescription('API para buscar cidade atual e cidades vizinhas usando coordenadas geográficas ou nome de cidade/endereço. Também gerencia locais de hospedagem (Casa de praia, Chalé, Pousada, etc.) com filtros por tipo, preço e localização. Utiliza Google Maps Geocoding API para geocodificação e MongoDB para armazenamento.')
        .setVersion('1.0')
        .addTag('cidades', 'Endpoints para buscar informações sobre cidades')
        .addTag('locais', 'Endpoints para gerenciar locais de hospedagem')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Aplicação rodando em http://localhost:${port}`);
    console.log(`📚 API disponível em http://localhost:${port}/api`);
    console.log(`📖 Swagger disponível em http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map