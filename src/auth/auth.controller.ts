import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Iniciar login com Google' })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para página de login do Google',
  })
  async googleAuth(@Req() req: Request) {
    // Guard redireciona automaticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const token = await this.authService.googleLogin(req.user as any);

    const state = req.query.state as string || '';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';

    // Tentar decodificar o redirect_uri do state (se foi codificado pelo guard)
    let redirectUri = '';
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        redirectUri = decodedState.redirect_uri || '';
      }
    } catch (error) {
      // State não é nosso formato customizado, continuar
    }

    // Se não tiver redirect_uri do state, verificar o Referer ou Origin header
    if (!redirectUri) {
      // Se o Referer ou Origin vierem do frontend (não do Swagger), assumir que é uma requisição do frontend
      if (
        (referer.includes('localhost:3001') && !referer.includes('/docs')) ||
        (origin.includes('localhost:3001') && !origin.includes('/docs'))
      ) {
        redirectUri = `${frontendUrl}/auth/callback`;
      }
    }

    // Verificar se é uma requisição do Swagger (backend)
    // Swagger sempre vem de localhost:3000/docs ou oauth2-redirect
    const isSwaggerRequest =
      referer.includes('/docs') ||
      referer.includes('oauth2-redirect') ||
      referer.includes('localhost:3000/docs') ||
      origin.includes('/docs') ||
      (origin.includes('localhost:3000') && origin.includes('/docs'));

    // Se NÃO for Swagger, assumir que é frontend
    // Usar o redirectUri do state se disponível, senão usar o FRONTEND_URL do .env
    if (!isSwaggerRequest) {
      let finalRedirectUri = redirectUri;

      // Se não tiver redirectUri do state, usar o FRONTEND_URL
      if (!finalRedirectUri || finalRedirectUri.includes('localhost:3000')) {
        finalRedirectUri = `${frontendUrl}/auth/callback`;
      }

      // Garantir que nunca redirecionamos para localhost:3000
      finalRedirectUri = finalRedirectUri.replace('localhost:3000', 'localhost:3001');

      return res.redirect(`${finalRedirectUri}?token=${token.access_token}`);
    }

    // Para Swagger (fluxo implicit), redirecionar para oauth2-redirect.html com token no hash
    // O formato do fluxo implicit é: #access_token=TOKEN&token_type=Bearer&state=STATE
    const redirectUrl = `/oauth2-redirect.html#access_token=${token.access_token}&token_type=Bearer&state=${encodeURIComponent(state)}`;

    return res.redirect(redirectUrl);
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback do Google OAuth (retorna JSON)',
  })
  @ApiResponse({
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
  })
  async googleLoginJson(@Req() req: Request) {
    return this.authService.googleLogin(req.user as any);
  }

  @Post('google/token')
  @ApiExcludeEndpoint()
  async googleTokenExchange(@Req() req: Request, @Res() res: Response) {
    // Este endpoint é usado pelo Swagger para trocar o código de autorização por token
    // Mas como já temos o token no callback, vamos redirecionar para o callback
    // Na verdade, o Swagger vai chamar isso após receber o código
    // Mas o Passport já fez a troca, então precisamos armazenar o token temporariamente
    // Por enquanto, vamos retornar um erro informando que o fluxo deve ser feito via callback
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Use the /auth/google endpoint to initiate OAuth flow',
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter informações do usuário autenticado (JWT)' })
  @ApiResponse({
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
  })
  async getProfile(@Req() req: Request) {
    // Extrair o token do header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || null;

    return {
      ...req.user,
      token,
    };
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout do usuário (JWT)' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso. O cliente deve remover o token.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async logout(@Req() req: Request) {
    // Com JWT stateless, o logout é principalmente uma ação do cliente
    // O token continua válido até expirar, mas o cliente deve removê-lo
    // Em produção, você pode implementar uma blacklist de tokens se necessário

    return {
      success: true,
      message: 'Logout realizado com sucesso. Remova o token do cliente.',
    };
  }
}

// Controller para servir o arquivo oauth2-redirect.html do Swagger UI
@Controller()
export class OAuth2RedirectController {
  @Get('oauth2-redirect.html')
  @ApiExcludeEndpoint()
  oauth2Redirect(@Req() req: Request, @Res() res: Response) {
    // Este é o arquivo HTML que o Swagger UI usa para processar o callback OAuth2
    const accessToken = req.query.access_token as string;
    const tokenType = req.query.token_type as string || 'Bearer';
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

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
}
