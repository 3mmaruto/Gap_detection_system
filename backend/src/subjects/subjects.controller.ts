import { Controller, Get, Param, ParseIntPipe, Query, Request, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subjects/v1')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * ?level_id=X  → subjects in that grade level
   * ?mine=true   → only subjects the calling teacher teaches (intersects with level_id if both given)
   */
  @Get()
  findAll(
    @Query('level_id') levelId?: string,
    @Query('mine') mine?: string,
    @Request() req?: { user: { id: number; role: string } },
  ) {
    const teacherId =
      mine === 'true' && req?.user.role === 'teacher' ? req.user.id : undefined;

    return this.subjectsService.findAll({
      levelId: levelId ? parseInt(levelId) : undefined,
      teacherId,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }
}
