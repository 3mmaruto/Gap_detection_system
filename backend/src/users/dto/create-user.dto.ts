import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type UserRole = 'student' | 'teacher' | 'admin';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsEnum(['student', 'teacher', 'admin'])
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  brith_date?: string;

  @IsOptional()
  @IsString()
  parent_phone?: string;

  @IsOptional()
  @IsString()
  father_name?: string;

  @IsOptional()
  @IsString()
  mother_name?: string;
}
