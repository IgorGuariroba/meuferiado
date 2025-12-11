import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateJwt(user: UserDocument) {
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      name: user.name,
      picture: user.picture,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  }

  async googleLogin(user: UserDocument) {
    return this.generateJwt(user);
  }
}

