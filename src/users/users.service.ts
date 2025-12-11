import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOrCreate(profile: {
    id: string;
    emails: Array<{ value: string }>;
    displayName: string;
    photos?: Array<{ value: string }>;
  }): Promise<UserDocument> {
    const email = profile.emails[0]?.value;
    const picture = profile.photos?.[0]?.value;

    let user = await this.userModel.findOne({ googleId: profile.id });

    if (!user) {
      user = await this.userModel.create({
        googleId: profile.id,
        email,
        name: profile.displayName,
        picture,
        provider: 'google',
      });
    } else {
      // Atualizar dados se necessário
      if (user.name !== profile.displayName || user.picture !== picture) {
        user.name = profile.displayName;
        if (picture) user.picture = picture;
        await user.save();
      }
    }

    return user;
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId });
  }
}

