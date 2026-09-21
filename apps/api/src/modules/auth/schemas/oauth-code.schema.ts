import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OAuthCodeDocument = OAuthCode & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'oauth_codes' })
export class OAuthCode {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const OAuthCodeSchema = SchemaFactory.createForClass(OAuthCode);
