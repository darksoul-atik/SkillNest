import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GroupCategory, GroupStatus } from '@skillnest/shared';

export type GroupDocument = Group & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'groups' })
export class Group {
  @Prop({ required: true, trim: true, minlength: 3, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true })
  slug: string;

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 5000 })
  description: string;

  @Prop({ type: String, enum: GroupCategory, required: true, index: true })
  category: GroupCategory;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 200 })
  location: string;

  @Prop({ type: Types.ObjectId, ref: 'Media', default: null })
  coverMediaId?: Types.ObjectId | null;

  @Prop({ required: true, min: 2, max: 1000 })
  maxMembers: number;

  @Prop({ default: 1, min: 1 })
  memberCount: number;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  hostId: Types.ObjectId;

  @Prop({ type: String, enum: GroupStatus, default: GroupStatus.ACTIVE, index: true })
  status: GroupStatus;

  @Prop({ type: Date, default: null, index: true })
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

GroupSchema.index({ category: 1, status: 1, startDate: 1 });
GroupSchema.index({ createdAt: -1, _id: -1 });
GroupSchema.index({ name: 'text', description: 'text', location: 'text' });
