"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth2RedirectController = exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async googleAuth(req) {
    }
    async googleAuthRedirect(req, res) {
        const token = await this.authService.googleLogin(req.user);
        const state = req.query.state || '';
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
        const referer = req.headers.referer || '';
        const origin = req.headers.origin || '';
        let redirectUri = '';
        try {
            if (state) {
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                redirectUri = decodedState.redirect_uri || '';
            }
        }
        catch (error) {
        }
        if (!redirectUri) {
            if ((referer.includes('localhost:3001') && !referer.includes('/docs')) ||
                (origin.includes('localhost:3001') && !origin.includes('/docs'))) {
                redirectUri = `${frontendUrl}/auth/callback`;
            }
        }
        const isSwaggerRequest = referer.includes('/docs') ||
            referer.includes('oauth2-redirect') ||
            referer.includes('localhost:3000/docs') ||
            origin.includes('/docs') ||
            (origin.includes('localhost:3000') && origin.includes('/docs'));
        if (!isSwaggerRequest) {
            let finalRedirectUri = redirectUri;
            if (!finalRedirectUri || finalRedirectUri.includes('localhost:3000')) {
                finalRedirectUri = `${frontendUrl}/auth/callback`;
            }
            finalRedirectUri = finalRedirectUri.replace('localhost:3000', 'localhost:3001');
            return res.redirect(`${finalRedirectUri}?token=${token.access_token}`);
        }
        const redirectUrl = `/oauth2-redirect.html#access_token=${token.access_token}&token_type=Bearer&state=${encodeURIComponent(state)}`;
        return res.redirect(redirectUrl);
    }
    async googleLoginJson(req) {
        return this.authService.googleLogin(req.user);
    }
    async googleTokenExchange(req, res) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Use the /auth/google endpoint to initiate OAuth flow',
        });
    }
    async getProfile(req) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '') || null;
        return {
            ...req.user,
            token,
        };
    }
    async logout(req) {
        return {
            success: true,
            message: 'Logout realizado com sucesso. Remova o token do cliente.',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar login com Google' }),
    (0, swagger_1.ApiResponse)({
        status: 302,
        description: 'Redireciona para página de login do Google',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
__decorate([
    (0, common_1.Get)('google/login'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Callback do Google OAuth (retorna JSON)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token JWT retornado com sucesso',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        picture: { type: 'string' },
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLoginJson", null);
__decorate([
    (0, common_1.Post)('google/token'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleTokenExchange", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter informações do usuário autenticado (JWT)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Perfil retornado com sucesso',
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                picture: { type: 'string' },
                token: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout do usuário (JWT)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logout realizado com sucesso. O cliente deve remover o token.',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
let OAuth2RedirectController = class OAuth2RedirectController {
    oauth2Redirect(req, res) {
        const accessToken = req.query.access_token;
        const tokenType = req.query.token_type || 'Bearer';
        const code = req.query.code;
        const state = req.query.state;
        const error = req.query.error;
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>OAuth2 Redirect</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <p>Processando autenticação...</p>
        <p style="font-size: 12px; color: #666;">Esta janela será fechada automaticamente</p>
    </div>
    <script>
        // Para fluxo implicit, o token vem no hash (#access_token=...)
        // O hash NÃO é enviado ao servidor, então precisamos ler aqui no JavaScript
        const hash = window.location.hash.substring(1); // Remove o #
        const hashParams = new URLSearchParams(hash);
        const urlParams = new URLSearchParams(window.location.search);

        // Priorizar hash (fluxo implicit), depois query string (fallback)
        const accessTokenFromHash = hashParams.get('access_token') || '';
        const accessTokenFromQuery = urlParams.get('access_token') || '';
        const accessToken = accessTokenFromHash || accessTokenFromQuery;

        const state = hashParams.get('state') || urlParams.get('state') || '';
        const tokenType = hashParams.get('token_type') || urlParams.get('token_type') || 'Bearer';

        // SEMPRE armazenar no localStorage primeiro (antes de qualquer coisa)
        if (accessToken && accessToken.length > 0) {
            try {
                localStorage.setItem('swagger_oauth_token', accessToken);
                localStorage.setItem('swagger_oauth_token_type', tokenType);
                localStorage.setItem('swagger_oauth_state', state);
            } catch (e) {
                // Silenciosamente ignorar erros de localStorage
            }
        }

        // Tentar múltiplas formas de enviar o token para o Swagger
        if (accessToken && accessToken.length > 0) {
            const message = {
                type: 'authorization_response',
                access_token: accessToken,
                token_type: tokenType,
                state: state,
                expires_in: 604800 // 7 dias em segundos
            };

            let messageSent = false;

            // Método 1: window.opener (popup do Swagger)
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.postMessage(message, window.location.origin);
                    messageSent = true;
                } catch (error) {
                    // Silenciosamente ignorar erros
                }
            }

            // Método 2: window.parent (iframe)
            if (window.parent && window.parent !== window) {
                try {
                    window.parent.postMessage(message, window.location.origin);
                    messageSent = true;
                } catch (error) {
                    // Silenciosamente ignorar erros
                }
            }

            // Método 3: window.top (top frame)
            if (window.top && window.top !== window) {
                try {
                    window.top.postMessage(message, window.location.origin);
                    messageSent = true;
                } catch (error) {
                    // Silenciosamente ignorar erros
                }
            }

            // Método 4: Broadcast para todas as janelas (fallback)
            if (!messageSent) {
                try {
                    window.postMessage(message, '*');
                    messageSent = true;
                } catch (error) {
                    // Silenciosamente ignorar erros
                }
            }

            // Fechar popup se existir, caso contrário redirecionar
            if (window.opener && !window.opener.closed) {
                setTimeout(() => {
                    try {
                        window.close();
                    } catch (e) {
                        // Se não conseguir fechar, redirecionar
                        window.location.href = '/docs';
                    }
                }, 500);
            } else {
                // Não é popup, redirecionar imediatamente
                window.location.replace('/docs');
            }
        } else {
            // Redirecionar de qualquer forma
            setTimeout(() => {
                window.location.href = '/docs';
            }, 1000);
        }
    </script>
</body>
</html>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
};
exports.OAuth2RedirectController = OAuth2RedirectController;
__decorate([
    (0, common_1.Get)('oauth2-redirect.html'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OAuth2RedirectController.prototype, "oauth2Redirect", null);
exports.OAuth2RedirectController = OAuth2RedirectController = __decorate([
    (0, common_1.Controller)()
], OAuth2RedirectController);
//# sourceMappingURL=auth.controller.js.map