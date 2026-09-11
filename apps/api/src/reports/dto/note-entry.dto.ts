import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class NoteEntryDto {
  @IsString()
  @MaxLength(1000)
  text: string;

  @IsOptional()
  @IsBoolean()
  isKey?: boolean;
}
