import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../users/schemas/user.schema';
export declare class AuthService {
    private jwtService;
    private configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateJwt(user: UserDocument): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            picture: string;
        };
    }>;
    googleLogin(user: UserDocument): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            picture: string;
        };
    }>;
}
