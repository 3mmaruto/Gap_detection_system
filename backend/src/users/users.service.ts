import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip = 0, take = 20, role?: string, search?: string) {
    const where: {
      admin?:   object | null;
      teacher?: object | null;
      student?: object | null;
      OR?: object[];
    } = {};

    if (role === 'admin')   where.admin   = { isNot: null };
    if (role === 'teacher') where.teacher = { isNot: null };
    if (role === 'student') where.student = { isNot: null };

    if (search?.trim()) {
      where.OR = [
        { first_name: { contains: search.trim(), mode: 'insensitive' } },
        { last_name:  { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, first_name: true, last_name: true, phone: true,
          gender: true, nationality: true, created_timestamp: true,
          last_login_at: true, brith_date: true,
          student: { select: { user_id: true } },
          teacher: { select: { user_id: true } },
          admin:   { select: { user_id: true } },
        },
        orderBy: { created_timestamp: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((u) => ({
        ...u,
        role: u.admin ? 'admin' : u.teacher ? 'teacher' : 'student',
        student: undefined, teacher: undefined, admin: undefined,
      })),
      total, skip, take,
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { student: true, teacher: true, admin: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password_hash: _, student, teacher, admin, ...safe } = user;
    return {
      ...safe,
      role: admin ? 'admin' : teacher ? 'teacher' : 'student',
      ...(student ? {
        parent_phone: student.parent_phone,
        father_name:  student.father_name,
        mother_name:  student.mother_name,
      } : {}),
    };
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { student: true } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: {
        first_name:  dto.first_name,
        last_name:   dto.last_name,
        phone:       dto.phone,
        gender:      dto.gender,
        nationality: dto.nationality,
        brith_date:  dto.brith_date ? new Date(dto.brith_date) : undefined,
      },
    });

    // Update student-specific fields if applicable
    if (user.student && (dto.parent_phone !== undefined || dto.father_name !== undefined || dto.mother_name !== undefined)) {
      await this.prisma.student.update({
        where: { user_id: id },
        data: {
          parent_phone: dto.parent_phone,
          father_name:  dto.father_name,
          mother_name:  dto.mother_name,
        },
      });
    }

    return this.findOne(id);
  }

  async create(dto: CreateUserDto, addedBy: number) {
    const password_hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          first_name:  dto.first_name,
          last_name:   dto.last_name,
          phone:       dto.phone,
          gender:      dto.gender,
          nationality: dto.nationality,
          brith_date:  dto.brith_date ? new Date(dto.brith_date) : undefined,
          added_by:    addedBy,
          password_hash,
        },
      });
      if (dto.role === 'student') {
        await tx.student.create({ data: { user_id: user.id, parent_phone: dto.parent_phone, father_name: dto.father_name, mother_name: dto.mother_name } });
      } else if (dto.role === 'teacher') {
        await tx.teacher.create({ data: { user_id: user.id } });
      } else {
        await tx.admin.create({ data: { user_id: user.id } });
      }
      const { password_hash: __, ...safe } = user;
      return { ...safe, role: dto.role };
    });
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  // ── Teacher subject+grade assignment ─────────────────────────────────────

  async getTeacherSubjects(teacherId: number) {
    const rows = await this.prisma.teacherSubject.findMany({
      where: { teacher_id: teacherId },
      include: {
        subject: { select: { id: true, name: true, name_ar: true } },
        level:   { select: { id: true, grade_level: true, curriculum_year: true } },
      },
      orderBy: [{ level: { grade_level: 'asc' } }, { subject: { name: 'asc' } }],
    });
    return rows.map((r) => ({
      subject_id:      r.subject_id,
      subject_name:    r.subject.name,
      subject_name_ar: r.subject.name_ar,
      level_id:        r.level_id,
      grade_level:     r.level.grade_level,
      curriculum_year: r.level.curriculum_year,
      assigned_at:     r.assigned_at,
    }));
  }

  async addTeacherSubject(teacherId: number, subjectId: number, levelId: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { user_id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const exists = await this.prisma.teacherSubject.findUnique({
      where: { teacher_id_subject_id_level_id: { teacher_id: teacherId, subject_id: subjectId, level_id: levelId } },
    });
    if (exists) throw new ConflictException('Subject already assigned for this grade');

    await this.prisma.teacherSubject.create({
      data: { teacher_id: teacherId, subject_id: subjectId, level_id: levelId },
    });
    return this.getTeacherSubjects(teacherId);
  }

  async removeTeacherSubject(teacherId: number, subjectId: number, levelId: number) {
    await this.prisma.teacherSubject.deleteMany({
      where: { teacher_id: teacherId, subject_id: subjectId, level_id: levelId },
    });
    return this.getTeacherSubjects(teacherId);
  }
}
