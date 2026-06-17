import { Controller, Get, Param, ParseIntPipe, Query, Request, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('students/v1')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.studentsService.findAll(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number; role: string } },
  ) {
    await this.studentsService.assertAccess(req.user.id, req.user.role, id);
    return this.studentsService.findOne(id);
  }

  @Get(':id/history')
  async history(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number; role: string } },
  ) {
    await this.studentsService.assertAccess(req.user.id, req.user.role, id);
    return this.studentsService.history(id);
  }

  @Get(':id/levels')
  async levels(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number; role: string } },
  ) {
    await this.studentsService.assertAccess(req.user.id, req.user.role, id);
    return this.studentsService.levels(id);
  }
}
