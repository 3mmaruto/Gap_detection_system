import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsInt()
  subject_id?: number;

  @IsOptional()
  @IsString()
  author_alias?: string;
}
