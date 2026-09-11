import { IsDateString, IsMongoId } from 'class-validator';

export class CreateReportDto {
  @IsDateString()
  weekStart: string;

  @IsDateString()
  weekEnd: string;

  @IsMongoId()
  project: string;
}
