import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Shared shape for both blockers and achievements —
// each has text plus a single "is this the key one" flag
@Schema({ _id: false })
export class NoteEntry {
  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ default: false })
  isKey: boolean;
}

export const NoteEntrySchema = SchemaFactory.createForClass(NoteEntry);
