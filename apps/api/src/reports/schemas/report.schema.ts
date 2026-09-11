import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReportStatus } from '../../common/enums/report-status.enum';
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

  // Points at the highest versionNumber inside `versions` —
  // this is what the UI reads/edits when the report is a Draft or Needs Correction
  @Prop({ required: true, default: 1 })
  currentVersion: number;

  @Prop({ type: [ReportVersionSchema], default: [] })
  versions: ReportVersion[];

  @Prop({ type: [ReviewEntrySchema], default: [] })
  reviews: ReviewEntry[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// One report per person per week — enforced by the database, not just app logic
ReportSchema.index({ owner: 1, weekStart: 1 }, { unique: true });
