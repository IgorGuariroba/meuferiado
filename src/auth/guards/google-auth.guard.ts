import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const redirectUri = request.query.redirect_uri as string;

    // Se houver redirect_uri, codificar no state para preservar após o callback do Google
    if (redirectUri) {
      // O Passport vai passar o state para o Google, e o Google vai retorná-lo no callback
      // Vamos codificar o redirect_uri no state
      request.query.state = Buffer.from(JSON.stringify({ redirect_uri: redirectUri })).toString('base64');
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}

