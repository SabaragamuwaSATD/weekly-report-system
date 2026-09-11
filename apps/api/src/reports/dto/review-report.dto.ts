import { IsEnum, IsString, MaxLength, ValidateIf } from 'class-validator';
import { ReviewAction } from '../../common/enums/review-action.enum';

export class ReviewReportDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  // Required only when requesting changes — this is exactly the kind of
  // conditional rule that belongs in the DTO, not the Mongoose schema
  // (see the note we left in Step 2 on ReviewEntry.comment).
  @ValidateIf(
    (dto: ReviewReportDto) => dto.action === ReviewAction.CHANGES_REQUESTED,
  )
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
