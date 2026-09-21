import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MembershipRole } from '@skillnest/shared';

export type MembershipDocument = Membership & Document<Types.ObjectId>;

@Schema({ timestamps: { createdAt: 'joinedAt', updatedAt: false }, collection: 'memberships' })
export class Membership {
  @Prop({ type: Types.ObjectId, ref: 'Group', required: true, index: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: MembershipRole, default: MembershipRole.MEMBER })
  role: MembershipRole;

  joinedAt: Date;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

MembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1, joinedAt: -1 });
