import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ReviewAction } from '../../common/enums/review-action.enum';

// One review action taken by a manager, tied to the version it reviewed
@Schema({ _id: false })
export class ReviewEntry {
  @Prop({ required: true })
  versionNumber: number; // which version in versions[] this comment is about

  @Prop({ type: String, enum: ReviewAction, required: true })
  action: ReviewAction;

  @Prop({ trim: true })
  comment?: string; // required by the API layer when action is CHANGES_REQUESTED

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewedBy: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  reviewedAt: Date;
}

export const ReviewEntrySchema = SchemaFactory.createForClass(ReviewEntry);
