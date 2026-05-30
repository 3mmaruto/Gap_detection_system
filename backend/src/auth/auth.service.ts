import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const userId = parseInt(dto.id, 10);
    if (isNaN(userId)) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const role = await this.resolveRole(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });

    const access_token = this.jwt.sign({ sub: userId, role });

    const { password_hash: _, ...safe } = user;
    return { access_token, user: { ...safe, role } };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const role = await this.resolveRole(userId);
    const { password_hash: _, ...safe } = user;
    return { ...safe, role };
  }

  private async resolveRole(userId: number): Promise<string> {
    if (await this.prisma.admin.findUnique({ where: { user_id: userId } })) return 'admin';
    if (await this.prisma.teacher.findUnique({ where: { user_id: userId } })) return 'teacher';
    return 'student';
  }
}
