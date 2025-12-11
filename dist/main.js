"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, express_session_1.default)({
        secret: configService.get('SESSION_SECRET') || 'sua-chave-secreta-super-segura-aqui',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        },
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('API de Cidades Vizinhas e Locais de Hospedagem')
        .setDescription('API para buscar cidade atual e cidades vizinhas usando coordenadas geográficas ou nome de cidade/endereço. Também gerencia locais de hospedagem (Casa de praia, Chalé, Pousada, etc.) com filtros por tipo, preço e localização. Utiliza Google Maps Geocoding API para geocodificação e MongoDB para armazenamento.')
        .setVersion('1.0')
        .addTag('cidades', 'Endpoints para buscar informações sobre cidades')
        .addTag('locais', 'Endpoints para gerenciar locais de hospedagem')
        .addTag('auth', 'Endpoints de autenticação')
        .addTag('users', 'Endpoints de usuários')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Cole o access_token JWT aqui',
        in: 'header',
    }, 'JWT-auth')
        .addOAuth2({
        type: 'oauth2',
        flows: {
            implicit: {
                authorizationUrl: 'http://localhost:3000/auth/google',
                scopes: {
                    'openid': 'Acesso ao OpenID Connect',
                    'profile': 'Acesso ao perfil do usuário',
                    'email': 'Acesso ao email do usuário',
                },
            },
        },
    }, 'google-oauth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const googleClientId = configService.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const googleCallbackUrl = configService.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback';
    const customJsCode = `
(function() {
  console.log('[SWAGGER] 🔍 Verificando token de autenticação...');

  // Função para aplicar o token JWT no Swagger
  const applyJwtToken = function(token) {
    try {
      if (window.ui && window.ui.authActions) {
        // Aplicar o token no JWT-auth
        window.ui.authActions.authorize({
          'JWT-auth': {
            name: 'JWT-auth',
            schema: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            },
            value: token
          }
        });
        console.log('[SWAGGER] ✅ Token JWT aplicado com sucesso no JWT-auth!');
        return true;
      } else {
        console.log('[SWAGGER] ⏳ Swagger UI ainda não carregou...');
        return false;
      }
    } catch (error) {
      console.error('[SWAGGER] ❌ Erro ao aplicar token:', error);
      return false;
    }
  };

  // Verificar se há token no localStorage (salvo pelo oauth2-redirect.html)
  const token = localStorage.getItem('swagger_oauth_token');
  if (token) {
    console.log('[SWAGGER] ✅ Token encontrado no localStorage, aplicando...');

    // Tentar aplicar imediatamente e depois com delays
    let applied = false;
    const attempts = [0, 100, 500, 1000, 2000];

    attempts.forEach((delay, index) => {
      setTimeout(() => {
        if (!applied) {
          applied = applyJwtToken(token);
          if (applied) {
            // Limpar localStorage após aplicar com sucesso
            localStorage.removeItem('swagger_oauth_token');
            localStorage.removeItem('swagger_oauth_token_type');
            localStorage.removeItem('swagger_oauth_state');
            console.log('[SWAGGER] 🧹 localStorage limpo');
          }
        }
      }, delay);
    });
  } else {
    console.log('[SWAGGER] ℹ️ Nenhum token encontrado no localStorage');
  }

  // Também escutar mensagens do oauth2-redirect.html
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'authorization_response' && event.data.access_token) {
      console.log('[SWAGGER] 📨 Mensagem de autorização recebida via postMessage');
      const token = event.data.access_token;

      // Armazenar no localStorage como fallback
      localStorage.setItem('swagger_oauth_token', token);
      localStorage.setItem('swagger_oauth_token_type', event.data.token_type || 'Bearer');

      // Aplicar o token
      if (applyJwtToken(token)) {
        localStorage.removeItem('swagger_oauth_token');
        localStorage.removeItem('swagger_oauth_token_type');
      }
    }
  });

  console.log('[SWAGGER] 👂 Escutando mensagens postMessage...');
})();
  `;
    fetch('http://127.0.0.1:7242/ingest/a92c5db2-bb5f-4e5e-bd80-e2916b4e2ebf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.ts:100', message: 'customJs code prepared', data: { customJsLength: customJsCode.length, customJsFirst50: customJsCode.substring(0, 50) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            requestInterceptor: (req) => {
                req.credentials = 'include';
                return req;
            },
            oauth: {
                clientId: googleClientId || '',
                clientSecret: googleClientSecret || '',
                realm: 'google-oauth',
                appName: 'API de Cidades Vizinhas',
                scopeSeparator: ' ',
                additionalQueryStringParams: {},
            },
            initOAuth: {
                clientId: googleClientId || '',
                clientSecret: googleClientSecret || '',
                realm: 'google-oauth',
                appName: 'API de Cidades Vizinhas',
                scopeSeparator: ' ',
                scopes: ['openid', 'profile', 'email'],
                useBasicAuthenticationWithAccessCodeGrant: false,
                usePkceWithAuthorizationCodeGrant: false,
            },
        },
        customSiteTitle: 'API de Cidades Vizinhas',
        customCss: `
      .swagger-ui .topbar { display: none }
    `,
        customJsStr: customJsCode,
    });
    fetch('http://127.0.0.1:7242/ingest/a92c5db2-bb5f-4e5e-bd80-e2916b4e2ebf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.ts:179', message: 'SwaggerModule.setup completed', data: { usedCustomJsStr: true, customJsStrLength: customJsCode.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
    fetch('http://127.0.0.1:7242/ingest/a92c5db2-bb5f-4e5e-bd80-e2916b4e2ebf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.ts:200', message: 'SwaggerModule.setup called', data: { hasCustomJs: true }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Aplicação rodando em http://localhost:${port}`);
    console.log(`📚 API disponível em http://localhost:${port}/api`);
    console.log(`📖 Swagger disponível em http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map