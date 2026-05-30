import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip = 0, take = 20) {
    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        skip,
        take,
        include: { user: { select: { id: true, first_name: true, last_name: true, phone: true, gender: true, nationality: true, brith_date: true, created_timestamp: true, last_login_at: true } } },
      }),
      this.prisma.student.count(),
    ]);
    return {
      items: items.map(({ user, ...s }) => ({ ...user, ...s, role: 'student' })),
      total, skip, take,
    };
  }

  async findOne(id: number) {
    const s = await this.prisma.student.findUnique({
      where: { user_id: id },
      include: { user: true },
    });
    if (!s) throw new NotFoundException('Student not found');
    const { user: { password_hash: _, ...user }, ...rest } = s;
    return { ...user, ...rest, role: 'student' };
  }

  async history(id: number) {
    return this.prisma.studentAcademicHistory.findMany({
      where: { student_id: id },
    });
  }
}
