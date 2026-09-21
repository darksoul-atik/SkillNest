import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByIdWithPassword(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+passwordHash').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findByProviderId(provider: 'google' | 'github', providerId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ [`providerIds.${provider}`]: providerId }).exec();
  }

  async findByResetTokenHash(tokenHash: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      })
      .select('+passwordResetTokenHash +passwordResetExpiresAt')
      .exec();
  }

  async updateById(
    id: string | Types.ObjectId,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
  }

  async findPaginated(filter: Record<string, unknown>, limit: number): Promise<UserDocument[]> {
    return this.userModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .exec();
  }

  async countTotal(filter: Record<string, unknown> = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }
}
