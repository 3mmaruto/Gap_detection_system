import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All grade levels ordered by grade then year. */
  findAll() {
    return this.prisma.level.findMany({
      orderBy: [{ grade_level: 'asc' }, { curriculum_year: 'asc' }],
    });
  }

  /**
   * Only levels that contain at least one subject assigned to this teacher
   * (via TeacherSubject → SubjectLevel).
   */
  findForTeacher(teacherId: number) {
    return this.prisma.level.findMany({
      where: {
        subjectLevels: {
          some: {
            subject: {
              teacherSubjects: { some: { teacher_id: teacherId } },
            },
          },
        },
      },
      orderBy: [{ grade_level: 'asc' }, { curriculum_year: 'asc' }],
    });
  }
}
