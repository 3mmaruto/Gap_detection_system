import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ party1: userId }, { party2: userId }] },
      include: {
        user1: { select: { id: true, first_name: true, last_name: true } },
        user2: { select: { id: true, first_name: true, last_name: true } },
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
  }

  findMessages(conversationId: number) {
    return this.prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findOrCreate(userId: number, otherId: number) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { party1: userId, party2: otherId },
          { party1: otherId, party2: userId },
        ],
      },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { party1: userId, party2: otherId },
    });
  }

  async sendMessage(conversationId: number, senderId: number, text: string) {
    const msg = await this.prisma.message.create({
      data: { conversation_id: conversationId, sender_id: senderId, text },
    });

    const conv = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
    const recipientId = conv.party1 === senderId ? conv.party2 : conv.party1;
    await this.prisma.notification.create({
      data: {
        user_id: recipientId,
        type: 'MESSAGE',
        text: 'You have a new message',
      },
    });
    return msg;
  }
}
