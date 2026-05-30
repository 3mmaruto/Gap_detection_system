import { Controller, Get, Patch, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications/v1')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req: { user: { id: number } }) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Patch(':id/seen')
  markSeen(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.notificationsService.markSeen(req.user.id, id);
  }

  @Patch('mark-all-seen')
  markAllSeen(@Request() req: { user: { id: number } }) {
    return this.notificationsService.markAllSeen(req.user.id);
  }
}
