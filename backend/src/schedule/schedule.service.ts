import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSlotDto } from './dto/upsert-slot.dto';
import { AddSyllabusDto } from './dto/add-syllabus.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(subjectId?: number, levelId?: number) {
    let whereSubjectIds: number[] | undefined;
    if (levelId && !subjectId) {
      const sl = await this.prisma.subjectLevel.findMany({
        where: { level_id: levelId },
        select: { subject_id: true },
      });
      whereSubjectIds = sl.map((r) => r.subject_id);
    }

    const where = subjectId
      ? { subject_id: subjectId }
      : whereSubjectIds
        ? { subject_id: { in: whereSubjectIds } }
        : undefined;

    const items = await this.prisma.scheduleItem.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, name_ar: true } },
        assignedBy: { select: { id: true, first_name: true, last_name: true } },
        syllabusItems: {
          include: { topic: { select: { id: true, name: true } } },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const entries = items.map((item) => ({
      schedule_item_id: item.id,
      subject_id: item.subject_id,
      subject_name: item.subject.name,
      topic_title: item.syllabusItems[0]?.topic.name ?? '',
      day: item.day,
      period: item.period,
    }));

    return {
      range_label: `${fmt(weekStart)} – ${fmt(weekEnd)}`,
      week_start: weekStart.toISOString().slice(0, 10),
      entries,
    };
  }

  /** Admin: create or replace the subject for a given day+period slot. */
  async upsertSlot(dto: UpsertSlotDto, assignedBy: number) {
    const existing = await this.prisma.scheduleItem.findUnique({
      where: { day_period: { day: dto.day, period: dto.period } },
    });

    if (existing) {
      return this.prisma.scheduleItem.update({
        where: { id: existing.id },
        data: { subject_id: dto.subject_id, assigned_by: assignedBy },
        include: { subject: true },
      });
    }

    return this.prisma.scheduleItem.create({
      data: {
        day: dto.day,
        period: dto.period,
        subject_id: dto.subject_id,
        assigned_by: assignedBy,
      },
      include: { subject: true },
    });
  }

  /** Admin: remove a slot entirely. */
  async removeSlot(day: string, period: number) {
    const item = await this.prisma.scheduleItem.findUnique({
      where: { day_period: { day, period } },
    });
    if (!item) return { deleted: false };
    await this.prisma.scheduleItem.delete({ where: { id: item.id } });
    return { deleted: true };
  }

  /** Teacher: get syllabus items for a schedule slot. */
  async getSyllabus(scheduleItemId: number) {
    return this.prisma.syllabusItem.findMany({
      where: { schedule_item_id: scheduleItemId },
      include: { topic: { select: { id: true, name: true, name_ar: true } } },
      orderBy: { id: 'asc' },
    });
  }

  /** Teacher: add a syllabus item (creates topic if name is new for that subject). */
  async addSyllabus(scheduleItemId: number, dto: AddSyllabusDto, assignedBy: number) {
    const slot = await this.prisma.scheduleItem.findUnique({
      where: { id: scheduleItemId },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');

    // Reuse topic with same name in this subject, or create one.
    let topic = await this.prisma.topic.findFirst({
      where: { subject_id: slot.subject_id, name: dto.topic_name },
    });
    if (!topic) {
      topic = await this.prisma.topic.create({
        data: {
          subject_id: slot.subject_id,
          name: dto.topic_name,
          name_ar: dto.topic_name_ar,
        },
      });
    }

    return this.prisma.syllabusItem.create({
      data: {
        schedule_item_id: scheduleItemId,
        topic_id: topic.id,
        assigned_by: assignedBy,
      },
      include: { topic: { select: { id: true, name: true } } },
    });
  }
}
