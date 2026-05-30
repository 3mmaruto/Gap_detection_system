import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('grades/v1')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  /** GET /api/grades/v1?student_id=X */
  @Get()
  findForStudent(@Query('student_id', ParseIntPipe) studentId: number) {
    return this.gradesService.findForStudent(studentId);
  }

  /** POST /api/grades/v1 — teacher or admin */
  @Post()
  create(
    @Body() dto: CreateGradeDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.gradesService.create(dto, req.user.id);
  }

  /** PATCH /api/grades/v1/:id — teacher (own) or admin */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
    @Request() req: { user: { id: number; role: string } },
  ) {
    return this.gradesService.update(id, dto, req.user.id, req.user.role);
  }

  /** DELETE /api/grades/v1/:id — teacher (own) or admin */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number; role: string } },
  ) {
    return this.gradesService.remove(id, req.user.id, req.user.role);
  }
}
