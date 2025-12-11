import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        _id: string;
        googleId: string;
        email: string;
        name: string;
        picture: string;
        isActive: boolean;
        provider: string;
        createdAt: any;
        updatedAt: any;
    }>;
}
