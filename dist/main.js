"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.enableCors();
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Aplicação rodando em http://localhost:${port}`);
    console.log(`📚 API disponível em http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map