import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskEntryDto } from './task-entry.dto';
import { NoteEntryDto } from './note-entry.dto';

export class ReportContentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskEntryDto)
  tasksCompleted: TaskEntryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskEntryDto)
  tasksPlannedNextWeek: TaskEntryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteEntryDto)
  blockers: NoteEntryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteEntryDto)
  achievements: NoteEntryDto[];

  // e.g. { "Development": 12, "Testing": 4 } — matches the schema's Map<string, number>
  @IsOptional()
  @IsObject()
  hoursByType?: Record<string, number>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
