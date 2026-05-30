import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('levels/v1')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  /**
   * ?mine=true → only levels the calling teacher teaches in.
   * Everyone else (or mine=false) → all levels.
   */
  @Get()
  findAll(
    @Query('mine') mine?: string,
    @Request() req?: { user: { id: number; role: string } },
  ) {
    if (mine === 'true' && req?.user.role === 'teacher') {
      return this.levelsService.findForTeacher(req.user.id);
    }
    return this.levelsService.findAll();
  }
}
