import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter perfil completo do usuário autenticado (do banco de dados)' })
  @ApiResponse({
    status: 200,
    description: 'Perfil completo retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        googleId: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        picture: { type: 'string' },
        isActive: { type: 'boolean' },
        provider: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  async getProfile(@Req() req: any) {
    // Retorna dados completos do usuário do banco de dados
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    const userObj = user.toObject();
    return {
      _id: user._id.toString(),
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      isActive: user.isActive,
      provider: user.provider,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
    };
  }
}

