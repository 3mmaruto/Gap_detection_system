import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  async markSeen(userId: number, id: number) {
    return this.prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { seen: true },
    });
  }

  async markAllSeen(userId: number) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, seen: false },
      data: { seen: true },
    });
  }
}
