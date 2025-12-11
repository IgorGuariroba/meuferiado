import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
    googleAuth(req: Request): Promise<void>;
    googleAuthRedirect(req: Request, res: Response): Promise<void>;
    googleLoginJson(req: Request): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            picture: string;
        };
    }>;
    googleTokenExchange(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getProfile(req: Request): Promise<{
        token: string;
    }>;
    logout(req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare class OAuth2RedirectController {
    oauth2Redirect(req: Request, res: Response): void;
}
