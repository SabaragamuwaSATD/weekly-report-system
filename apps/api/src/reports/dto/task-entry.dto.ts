import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class TaskEntryDto {
  @IsString()
  @MaxLength(200)
  taskName: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsNumber()
  @Min(0)
  @Max(100)
  plannedPercent: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  actualPercent: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsNumber()
  @Min(0)
  timePlannedHours: number;

  @IsNumber()
  @Min(0)
  timeSpentHours: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  output?: string;
}
