import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, mongo } from 'mongoose';
import { Readable } from 'stream';
import { Media, MediaDocument } from './schemas/media.schema';

@Injectable()
export class MediaRepository implements OnModuleInit {
  private bucket!: mongo.GridFSBucket;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
  ) {}

  onModuleInit() {
    if (this.connection.db) {
      this.bucket = new mongo.GridFSBucket(this.connection.db, { bucketName: 'media' });
    }
  }

  private getBucket(): mongo.GridFSBucket {
    if (!this.bucket && this.connection.db) {
      this.bucket = new mongo.GridFSBucket(this.connection.db, { bucketName: 'media' });
    }
    return this.bucket;
  }

  async uploadToGridFS(
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<Types.ObjectId> {
    const bucket = this.getBucket();
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        contentType,
      });

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      readable
        .pipe(uploadStream)
        .on('finish', () => resolve(new Types.ObjectId(uploadStream.id)))
        .on('error', reject);
    });
  }

  async getGridFSFileInfo(fileId: Types.ObjectId): Promise<mongo.GridFSFile | null> {
    const bucket = this.getBucket();
    const files = await bucket.find({ _id: fileId }).toArray();
    return files[0] || null;
  }

  openDownloadStream(
    fileId: Types.ObjectId,
    options?: { start?: number; end?: number },
  ) {
    const bucket = this.getBucket();
    return bucket.openDownloadStream(fileId, options);
  }

  async deleteGridFSFile(fileId: Types.ObjectId): Promise<void> {
    const bucket = this.getBucket();
    try {
      await bucket.delete(fileId);
    } catch {
      // Ignore if file doesn't exist in GridFS
    }
  }

  async createMediaRecord(data: Partial<Media>): Promise<MediaDocument> {
    const doc = new this.mediaModel(data);
    return doc.save();
  }

  async findMediaById(id: string | Types.ObjectId): Promise<MediaDocument | null> {
    return this.mediaModel.findById(id).exec();
  }

  async findByChecksumAndOwner(checksum: string, ownerId: Types.ObjectId): Promise<MediaDocument | null> {
    return this.mediaModel.findOne({ checksum, ownerId }).exec();
  }

  async deleteMediaRecord(id: Types.ObjectId): Promise<void> {
    await this.mediaModel.findByIdAndDelete(id).exec();
  }

  async findUnreferencedOlderThan(cutoff: Date): Promise<MediaDocument[]> {
    return this.mediaModel
      .find({
        isReferenced: false,
        createdAt: { $lt: cutoff },
      })
      .exec();
  }
}
