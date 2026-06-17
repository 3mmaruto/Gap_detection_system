import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('posts/v1')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('subject_id') subjectId?: string,
    @Query('type') type?: string,
  ) {
    return this.postsService.findAll(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
      subjectId ? parseInt(subjectId) : undefined,
      type,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreatePostDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.postsService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @Request() req: { user: { id: number; role: string } },
  ) {
    return this.postsService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number; role: string } },
  ) {
    return this.postsService.remove(id, req.user.id, req.user.role);
  }
}
