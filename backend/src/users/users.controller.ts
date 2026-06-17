import {
  Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe,
  Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { StudentsService } from '../students/students.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users/v1')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
  ) {}

  @Get()
  findAll(
    @Query('skip')   skip?: string,
    @Query('take')   take?: string,
    @Query('role')   role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(
      skip   ? parseInt(skip) : 0,
      take   ? parseInt(take) : 20,
      role   || undefined,
      search || undefined,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number; role: string } },
  ) {
    // Students can only view their own profile
    if (req.user.role === 'student' && req.user.id !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Request() req: { user: { id: number } }) {
    return this.usersService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  // ── Teacher subject+grade assignment ────────────────────────────────────

  @Get(':id/subjects')
  getSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getTeacherSubjects(id);
  }

  @Post(':id/subjects')
  addSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body('subject_id', ParseIntPipe) subjectId: number,
    @Body('level_id', ParseIntPipe) levelId: number,
  ) {
    return this.usersService.addTeacherSubject(id, subjectId, levelId);
  }

  /** DELETE /users/v1/:id/subjects?subject_id=X&level_id=Y */
  @Delete(':id/subjects')
  removeSubject(
    @Param('id', ParseIntPipe) id: number,
    @Query('subject_id', ParseIntPipe) subjectId: number,
    @Query('level_id', ParseIntPipe) levelId: number,
  ) {
    return this.usersService.removeTeacherSubject(id, subjectId, levelId);
  }
}
