import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReportStatus } from '../../common/enums/report-status.enum';
import { ReportContent, ReportContentSchema } from './report-content.schema';
import { ReportVersion, ReportVersionSchema } from './report-version.schema';
import { ReviewEntry, ReviewEntrySchema } from './review-entry.schema';

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  // Start of the ISO week this report covers, e.g. every Monday.
  // Indexed + combined with owner below to stop duplicate reports for the same week.
  @Prop({ required: true })
  weekStart: Date;

  @Prop({ required: true })
  weekEnd: Date;

  @Prop({
    type: String,
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
    index: true,
  })
  status: ReportStatus;

  // Points at the versionNumber this draft WILL become once submitted
  @Prop({ required: true, default: 1 })
  currentVersion: number;

  // The live, editable draft — this is what create/update endpoints touch
  @Prop({ type: ReportContentSchema, default: () => ({}) })
  content: ReportContent;

  // Frozen snapshots, one per submit/resubmit cycle
  @Prop({ type: [ReportVersionSchema], default: [] })
  versions: ReportVersion[];

  @Prop({ type: [ReviewEntrySchema], default: [] })
  reviews: ReviewEntry[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// One report per person per week — enforced by the database, not just app logic
ReportSchema.index({ owner: 1, weekStart: 1 }, { unique: true });
