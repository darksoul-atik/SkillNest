import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReplyDocument = Reply & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'replies' })
export class Reply {
  @Prop({ type: Types.ObjectId, ref: 'Comment', required: true, index: true })
  commentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: true, index: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 1000 })
  body: string;

  @Prop({ type: Date, default: null })
  editedAt?: Date | null;

  @Prop({ type: Date, default: null, index: true })
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ReplySchema = SchemaFactory.createForClass(Reply);

ReplySchema.index({ commentId: 1, createdAt: 1, _id: 1 });
ReplySchema.index({ authorId: 1, createdAt: -1 });
