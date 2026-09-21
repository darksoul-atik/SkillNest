import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole, AuthProvider } from '@skillnest/shared';

export type UserDocument = User & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: false, select: false })
  passwordHash?: string;

  @Prop({ type: Types.ObjectId, ref: 'Media', default: null })
  avatarMediaId?: Types.ObjectId | null;

  @Prop({ type: [String], enum: AuthProvider, default: [AuthProvider.LOCAL] })
  providers: AuthProvider[];

  @Prop({
    type: {
      google: { type: String, default: null },
      github: { type: String, default: null },
    },
    default: {},
  })
  providerIds: {
    google?: string;
    github?: string;
  };

  @Prop({ type: String, enum: UserRole, default: UserRole.USER, index: true })
  role: UserRole;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: String, select: false, default: null })
  passwordResetTokenHash?: string | null;

  @Prop({ type: Date, select: false, default: null })
  passwordResetExpiresAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ createdAt: -1, _id: -1 });
