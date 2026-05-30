import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AddSyllabusDto {
  @IsNotEmpty()
  @IsString()
  topic_name: string;

  @IsOptional()
  @IsString()
  topic_name_ar?: string;
}
