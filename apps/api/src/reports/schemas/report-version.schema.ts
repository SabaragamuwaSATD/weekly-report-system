import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ReportContent, ReportContentSchema } from './report-content.schema';

// One frozen snapshot of report content, taken at the moment of a submit/resubmit
@Schema({ _id: false })
export class ReportVersion {
  @Prop({ required: true })
  versionNumber: number;

  @Prop({ type: ReportContentSchema, required: true })
  content: ReportContent;

  @Prop({ required: true, default: () => new Date() })
  submittedAt: Date;
}

export const ReportVersionSchema = SchemaFactory.createForClass(ReportVersion);
