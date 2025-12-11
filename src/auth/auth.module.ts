import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController, OAuth2RedirectController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const jwtSecret = config.get<string>('JWT_SECRET') || 'sua-chave-secreta-super-segura-aqui';
        const jwtExpiration = config.get<string>('JWT_EXPIRES_IN') || config.get<string>('JWT_EXPIRATION') || '7d';

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: jwtExpiration as any,
          },
        };
      },
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController, OAuth2RedirectController],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}

