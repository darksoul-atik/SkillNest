import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MediaPurpose } from '@skillnest/shared';

export type MediaDocument = Media & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'media' })
export class Media {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, enum: MediaPurpose, required: true })
  purpose: MediaPurpose;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, default: 'image/webp' })
  mime: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true, index: true })
  checksum: string;

  @Prop({ type: Types.ObjectId, required: true })
  fileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  thumbFileId: Types.ObjectId;

  @Prop({ default: false, index: true })
  isReferenced: boolean;

  @Prop({ type: Date, default: null })
  referencedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ ownerId: 1, checksum: 1 });
MediaSchema.index({ isReferenced: 1, createdAt: 1 });
