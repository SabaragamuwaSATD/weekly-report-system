import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus } from '../../common/enums/report-status.enum';

export class QueryReportsDto {
  // Manager-only filter — a team member's own ID is enforced server-side regardless
  @IsOptional()
  @IsMongoId()
  owner?: string;

  @IsOptional()
  @IsMongoId()
  project?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @IsOptional()
  @IsDateString()
  weekEnd?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
