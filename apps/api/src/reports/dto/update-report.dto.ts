import { IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportContentDto } from './report-content.dto';

export class UpdateReportDto {
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ValidateNested()
  @Type(() => ReportContentDto)
  content: ReportContentDto;
}
