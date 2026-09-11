import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { TaskPriority } from '../../common/enums/task-priority.enum';

// _id: false — these only ever exist nested inside a report version,
// they don't need their own identity or independent queries
@Schema({ _id: false })
export class TaskEntry {
  @Prop({ required: true, trim: true })
  taskName: string;

  @Prop({ type: String, enum: TaskPriority, required: true })
  priority: TaskPriority;

  @Prop({ min: 0, max: 100, default: 0 })
  plannedPercent: number;

  @Prop({ min: 0, max: 100, default: 0 })
  actualPercent: number;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.NOT_STARTED })
  status: TaskStatus;

  @Prop({ min: 0, default: 0 })
  timePlannedHours: number;

  @Prop({ min: 0, default: 0 })
  timeSpentHours: number;

  @Prop({ trim: true })
  output?: string;
}

export const TaskEntrySchema = SchemaFactory.createForClass(TaskEntry);
