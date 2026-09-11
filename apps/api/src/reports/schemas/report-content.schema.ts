import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskEntry, TaskEntrySchema } from './task-entry.schema';
import { NoteEntry, NoteEntrySchema } from './note-entry.schema';

// The actual report data — reused as the live "draft" on Report.content,
// and frozen as a snapshot inside each ReportVersion.
@Schema({ _id: false })
export class ReportContent {
  @Prop({ type: [TaskEntrySchema], default: [] })
  tasksCompleted: TaskEntry[];

  @Prop({ type: [TaskEntrySchema], default: [] })
  tasksPlannedNextWeek: TaskEntry[];

  @Prop({ type: [NoteEntrySchema], default: [] })
  blockers: NoteEntry[];

  @Prop({ type: [NoteEntrySchema], default: [] })
  achievements: NoteEntry[];

  @Prop({ type: Map, of: Number, default: {} })
  hoursByType: Map<string, number>;

  @Prop({ trim: true })
  notes?: string;
}

export const ReportContentSchema = SchemaFactory.createForClass(ReportContent);
