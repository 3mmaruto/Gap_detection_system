import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip = 0, take = 20, subjectId?: number, type?: string) {
    const where = {
      ...(subjectId != null ? { subject_id: subjectId } : {}),
      ...(type ? { type: type as PostType } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        include: {
          author: { select: { id: true, first_name: true, last_name: true } },
          subject: { select: { id: true, name: true } },
          attachments: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, first_name: true, last_name: true } },
        subject: { select: { id: true, name: true } },
        attachments: true,
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto, userId: number) {
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        type: dto.type,
        content: dto.content,
        thumbnail_url: dto.thumbnail_url,
        subject_id: dto.subject_id,
        user_id: userId,
      },
      include: {
        author: { select: { id: true, first_name: true, last_name: true } },
        subject: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    await this.notifyUsersOfPost(post.id, post.title, userId);
    return post;
  }

  async update(id: number, dto: UpdatePostDto, userId: number, role: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.user_id !== userId && role !== 'admin') {
      throw new ForbiddenException('You can only edit your own posts');
    }
    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: {
        author: { select: { id: true, first_name: true, last_name: true } },
        subject: { select: { id: true, name: true } },
        attachments: true,
      },
    });
  }

  async remove(id: number, userId: number, role: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.user_id !== userId && role !== 'admin') {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.prisma.post.delete({ where: { id } });
    return { id };
  }

  private async notifyUsersOfPost(postId: number, title: string, authorId: number) {
    const users = await this.prisma.user.findMany({
      where: { id: { not: authorId } },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        user_id: u.id,
        type: 'POST' as const,
        text: `New post: "${title}"`,
      })),
    });
  }
}
