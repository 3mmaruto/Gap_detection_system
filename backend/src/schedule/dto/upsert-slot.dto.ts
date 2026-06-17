import { IsIn, IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export class UpsertSlotDto {
  @IsString()
  @IsIn(DAYS)
  day: string;

  @IsInt()
  @Min(1)
  @Max(7)
  period: number;

  @IsInt()
  subject_id: number;
}
