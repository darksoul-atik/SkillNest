import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
const sharp = require('sharp');
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
const fileType = require('file-type');
import { MediaRepository } from './media.repository';
import { MediaMapper } from './dto/media.mapper';
import { MediaPurpose, MediaResponse } from '@skillnest/shared';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly mediaRepository: MediaRepository) {}

  async validateAndUpload(
    file: Express.Multer.File,
    ownerId: string,
    purpose: MediaPurpose = MediaPurpose.GROUP_COVER,
  ): Promise<MediaResponse> {
    if (!file || !file.buffer) {
      throw new UnsupportedMediaTypeException('No file buffer provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException('File size exceeds the 5MB limit');
    }

    // Magic-byte sniffing
    const detectedType = await fileType.fromBuffer(file.buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      throw new UnsupportedMediaTypeException(
        `Unsupported media format. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Checksum for deduplication
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const ownerObjectId = new Types.ObjectId(ownerId);
    const existing = await this.mediaRepository.findByChecksumAndOwner(checksum, ownerObjectId);
    if (existing) {
      return MediaMapper.toResponse(existing);
    }

    // Process main image (max 1600px, strip EXIF, webp quality 80)
    const { data: mainBuffer, info: mainInfo } = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    // Process thumbnail (320x320 cover, webp quality 75)
    const { data: thumbBuffer } = await sharp(file.buffer)
      .rotate()
      .resize(320, 320, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer({ resolveWithObject: true });

    // Upload to GridFS
    const mainFileId = await this.mediaRepository.uploadToGridFS(
      `${nanoid(16)}.webp`,
      mainBuffer,
      'image/webp',
    );

    const thumbFileId = await this.mediaRepository.uploadToGridFS(
      `${nanoid(16)}_thumb.webp`,
      thumbBuffer,
      'image/webp',
    );

    // Create metadata document
    const mediaDoc = await this.mediaRepository.createMediaRecord({
      ownerId: ownerObjectId,
      purpose,
      originalName: file.originalname,
      mime: 'image/webp',
      size: mainInfo.size,
      width: mainInfo.width,
      height: mainInfo.height,
      checksum,
      fileId: mainFileId,
      thumbFileId: thumbFileId,
      isReferenced: false,
    });

    return MediaMapper.toResponse(mediaDoc);
  }

  async streamMedia(
    id: string,
    isThumb: boolean,
    req: Request,
    res: Response,
  ): Promise<void> {
    const media = await this.mediaRepository.findMediaById(id);
    if (!media) {
      throw new NotFoundException('Media asset not found');
    }

    const targetFileId = isThumb ? media.thumbFileId : media.fileId;
    const fileInfo = await this.mediaRepository.getGridFSFileInfo(targetFileId);
    if (!fileInfo) {
      throw new NotFoundException('Binary asset not found in GridFS storage');
    }

    const etag = `"${targetFileId.toString()}-${fileInfo.length}"`;

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    res.setHeader('Accept-Ranges', 'bytes');

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0] || '0', 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileInfo.length - 1;

      if (start >= fileInfo.length || end >= fileInfo.length || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileInfo.length}`).end();
        return;
      }

      const chunksize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileInfo.length}`);
      res.setHeader('Content-Length', chunksize);

      const stream = this.mediaRepository.openDownloadStream(targetFileId, { start, end: end + 1 });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileInfo.length);
      const stream = this.mediaRepository.openDownloadStream(targetFileId);
      stream.pipe(res);
    }
  }

  async deleteMedia(id: string, user: { id: string; role: string }): Promise<void> {
    const media = await this.mediaRepository.findMediaById(id);
    if (!media) {
      throw new NotFoundException('Media asset not found');
    }

    const isOwner = media.ownerId.toString() === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this asset');
    }

    await this.mediaRepository.deleteGridFSFile(media.fileId);
    await this.mediaRepository.deleteGridFSFile(media.thumbFileId);
    await this.mediaRepository.deleteMediaRecord(media._id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOrphanMedia(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orphans = await this.mediaRepository.findUnreferencedOlderThan(cutoff);

    for (const orphan of orphans) {
      try {
        await this.mediaRepository.deleteGridFSFile(orphan.fileId);
        await this.mediaRepository.deleteGridFSFile(orphan.thumbFileId);
        await this.mediaRepository.deleteMediaRecord(orphan._id);
      } catch (err) {
        this.logger.error(`Error cleaning up orphan media ${orphan._id}:`, err);
      }
    }

    if (orphans.length > 0) {
      this.logger.log(`Cleaned up ${orphans.length} unreferenced media assets older than 24h.`);
    }
  }
}
