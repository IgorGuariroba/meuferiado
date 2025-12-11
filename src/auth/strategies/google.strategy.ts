import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: true, // Permite acessar o request no validate
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const displayName = name?.givenName && name?.familyName
        ? `${name.givenName} ${name.familyName}`
        : name?.displayName || emails?.[0]?.value || 'Usuário';

      const user = await this.usersService.findOrCreate({
        id,
        displayName,
        emails: emails || [],
        photos: photos || [],
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}

