import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshSessionDocument = RefreshSession & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'refresh_sessions' })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tokenHash: string;

  @Prop({ required: true, index: true })
  familyId: string;

  @Prop({ default: 'unknown' })
  userAgent: string;

  @Prop({ default: 'unknown' })
  ip: string;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  @Prop({ type: String, default: null })
  replacedBy?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);
RefreshSessionSchema.index({ familyId: 1, revokedAt: 1 });
