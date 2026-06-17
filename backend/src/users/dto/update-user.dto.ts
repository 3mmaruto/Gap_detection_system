import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() brith_date?: string;
  @IsOptional() @IsString() parent_phone?: string;
  @IsOptional() @IsString() father_name?: string;
  @IsOptional() @IsString() mother_name?: string;
}
