import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Group', required: true, index: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 1000 })
  body: string;

  @Prop({ default: 0, min: 0 })
  replyCount: number;

  @Prop({ type: Date, default: null })
  editedAt?: Date | null;

  @Prop({ type: Date, default: null, index: true })
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ groupId: 1, createdAt: -1, _id: -1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });
