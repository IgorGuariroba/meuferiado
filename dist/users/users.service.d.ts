import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findOrCreate(profile: {
        id: string;
        emails: Array<{
            value: string;
        }>;
        displayName: string;
        photos?: Array<{
            value: string;
        }>;
    }): Promise<UserDocument>;
    findById(id: string): Promise<UserDocument | null>;
    findByGoogleId(googleId: string): Promise<UserDocument | null>;
}
