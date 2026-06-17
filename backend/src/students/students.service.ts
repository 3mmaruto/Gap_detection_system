import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async levels(id: number) {
    return this.prisma.studentLevel.findMany({
      where: { student_id: id },
      include: { level: true },
    });
  }

  /** Returns true if the teacher shares at least one level with the student. */
  async teacherTeachesStudent(teacherId: number, studentId: number): Promise<boolean> {
    const studentLevels = await this.prisma.studentLevel.findMany({
      where: { student_id: studentId },
      select: { level_id: true },
    });
    if (studentLevels.length === 0) return false;
    const levelIds = studentLevels.map((sl) => sl.level_id);
    const match = await this.prisma.teacherSubject.findFirst({
      where: { teacher_id: teacherId, level_id: { in: levelIds } },
    });
    return match !== null;
  }

  /** Throws 403 if caller has no access to this student's private data. */
  async assertAccess(callerId: number, callerRole: string, studentId: number) {
    if (callerRole === 'admin') return;
    if (callerRole === 'student') {
      if (callerId !== studentId) throw new ForbiddenException();
      return;
    }
    if (callerRole === 'teacher') {
      const teaches = await this.teacherTeachesStudent(callerId, studentId);
      if (!teaches) throw new ForbiddenException();
    }
  }
}
