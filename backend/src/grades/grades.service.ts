import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForStudent(studentId: number) {
    const rows = await this.prisma.partGrade.findMany({
      where: { student_id: studentId },
      include: {
        subject:    { select: { id: true, name: true, name_ar: true } },
        assignedBy: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: [{ subject: { name: 'asc' } }, { assigned_at: 'desc' }],
    });
    return rows;
  }

  async create(dto: CreateGradeDto, assignedById: number) {
    const grade = await this.prisma.partGrade.create({
      data: {
        student_id:  dto.student_id,
        assigned_by: assignedById,
        subject_id:  dto.subject_id,
        max_grade:   dto.max_grade,
        value:       dto.value,
        label:       dto.label,
      },
      include: {
        subject:    { select: { id: true, name: true } },
        assignedBy: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    const pct = Math.round((grade.value / grade.max_grade) * 100);
    const labelPart = grade.label ? ` (${grade.label})` : '';
    await this.prisma.notification.create({
      data: {
        user_id: dto.student_id,
        type: 'GRADE',
        text: `New grade posted${labelPart} — ${grade.subject.name}: ${grade.value}/${grade.max_grade} (${pct}%)`,
      },
    });

    return grade;
  }

  async update(id: number, dto: UpdateGradeDto, requesterId: number, requesterRole: string) {
    const grade = await this.prisma.partGrade.findUnique({
      where: { id },
      include: { subject: { select: { id: true, name: true } } },
    });
    if (!grade) throw new NotFoundException('Grade not found');
    if (grade.assigned_by !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You can only edit grades you assigned');
    }

    const updated = await this.prisma.partGrade.update({
      where: { id },
      data: {
        ...(dto.value    != null ? { value:     dto.value }    : {}),
        ...(dto.max_grade != null ? { max_grade: dto.max_grade } : {}),
        ...(dto.label    != null ? { label:     dto.label }    : {}),
      },
      include: {
        subject:    { select: { id: true, name: true } },
        assignedBy: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    const pct = Math.round((updated.value / updated.max_grade) * 100);
    const labelPart = updated.label ? ` (${updated.label})` : '';
    await this.prisma.notification.create({
      data: {
        user_id: updated.student_id,
        type: 'GRADE',
        text: `Grade updated${labelPart} — ${updated.subject.name}: ${updated.value}/${updated.max_grade} (${pct}%)`,
      },
    });

    return updated;
  }

  async remove(id: number, requesterId: number, requesterRole: string) {
    const grade = await this.prisma.partGrade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');
    if (grade.assigned_by !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You can only delete grades you assigned');
    }
    await this.prisma.partGrade.delete({ where: { id } });
    return { id };
  }
}
