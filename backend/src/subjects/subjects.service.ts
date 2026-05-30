import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(opts: { levelId?: number; teacherId?: number } = {}) {
    const { levelId, teacherId } = opts;

    const where: Record<string, unknown> = {};

    if (levelId) {
      where.subjectLevels = { some: { level_id: levelId } };
    }

    if (teacherId) {
      where.teacherSubjects = { some: { teacher_id: teacherId } };
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.subject.findUniqueOrThrow({ where: { id } });
  }
}
