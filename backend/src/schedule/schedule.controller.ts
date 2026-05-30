import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Post, Put, Query, Request, UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpsertSlotDto } from './dto/upsert-slot.dto';
import { AddSyllabusDto } from './dto/add-syllabus.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('schedule/v1')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  findAll(@Query('subject_id') subjectId?: string) {
    return this.scheduleService.findAll(subjectId ? parseInt(subjectId) : undefined);
  }

  /** Admin: assign a subject to a day+period slot. */
  @Put('slot')
  upsertSlot(
    @Body() dto: UpsertSlotDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.scheduleService.upsertSlot(dto, req.user.id);
  }

  /** Admin: clear a slot. */
  @Delete('slot')
  removeSlot(
    @Query('day') day: string,
    @Query('period') period: string,
  ) {
    return this.scheduleService.removeSlot(day, parseInt(period));
  }

  /** All: get syllabus items for a slot. */
  @Get(':id/syllabus')
  getSyllabus(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.getSyllabus(id);
  }

  /** Teacher: add a syllabus item to a slot. */
  @Post(':id/syllabus')
  addSyllabus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddSyllabusDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.scheduleService.addSyllabus(id, dto, req.user.id);
  }
}
