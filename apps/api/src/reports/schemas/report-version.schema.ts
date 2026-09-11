import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskEntry, TaskEntrySchema } from './task-entry.schema';
import { NoteEntry, NoteEntrySchema } from './note-entry.schema';

// One full snapshot of report content at the moment it was submitted.
// A report can hold many of these — one per submit/resubmit cycle.
@Schema({ _id: false })
export class ReportVersion {
  @Prop({ required: true })
  versionNumber: number;

  @Prop({ type: [TaskEntrySchema], default: [] })
  tasksCompleted: TaskEntry[];

  @Prop({ type: [TaskEntrySchema], default: [] })
  tasksPlannedNextWeek: TaskEntry[];

  @Prop({ type: [NoteEntrySchema], default: [] })
  blockers: NoteEntry[];

  @Prop({ type: [NoteEntrySchema], default: [] })
  achievements: NoteEntry[];

  // Optional — hours broken down by category, e.g. { Development: 12, Testing: 4 }
  @Prop({ type: Map, of: Number, default: {} })
  hoursByType: Map<string, number>;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ required: true, default: () => new Date() })
  submittedAt: Date;
}

export const ReportVersionSchema = SchemaFactory.createForClass(ReportVersion);
