import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateGradeDto {
  @IsInt()
  student_id: number;

  @IsInt()
  subject_id: number;

  @IsNumber()
  @IsPositive()
  max_grade: number;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsString()
  label?: string; // e.g. "Midterm", "Final", "Quiz 1"
}
