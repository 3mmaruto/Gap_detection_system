import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsNumber()
  max_grade?: number;

  @IsOptional()
  @IsString()
  label?: string;
}
