import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshSession, RefreshSessionDocument } from './schemas/refresh-session.schema';
import { OAuthCode, OAuthCodeDocument } from './schemas/oauth-code.schema';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    @InjectModel(OAuthCode.name)
    private readonly oauthCodeModel: Model<OAuthCodeDocument>,
  ) {}

  async createRefreshSession(sessionData: Partial<RefreshSession>): Promise<RefreshSessionDocument> {
    const session = new this.refreshSessionModel(sessionData);
    return session.save();
  }

  async findRefreshSessionByHash(tokenHash: string): Promise<RefreshSessionDocument | null> {
    return this.refreshSessionModel.findOne({ tokenHash }).exec();
  }

  async revokeSession(id: Types.ObjectId, replacedBy?: string): Promise<void> {
    await this.refreshSessionModel
      .findByIdAndUpdate(id, {
        $set: {
          revokedAt: new Date(),
          replacedBy: replacedBy || null,
        },
      })
      .exec();
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.refreshSessionModel
      .updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  async revokeAllUserSessions(userId: Types.ObjectId): Promise<void> {
    await this.refreshSessionModel
      .updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  async createOAuthCode(userId: Types.ObjectId, code: string, ttlSeconds = 300): Promise<OAuthCodeDocument> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const oauthCode = new this.oauthCodeModel({ userId, code, expiresAt });
    return oauthCode.save();
  }

  async consumeOAuthCode(code: string): Promise<OAuthCodeDocument | null> {
    return this.oauthCodeModel
      .findOneAndUpdate(
        { code, used: false, expiresAt: { $gt: new Date() } },
        { $set: { used: true } },
        { new: true },
      )
      .exec();
  }
}
