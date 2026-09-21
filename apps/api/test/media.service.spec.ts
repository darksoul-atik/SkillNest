import { Test, TestingModule } from '@nestjs/testing';
import { PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { Types } from 'mongoose';
const sharp = require('sharp');
import { MediaService } from '../src/modules/media/media.service';
import { MediaRepository } from '../src/modules/media/media.repository';
import { MediaPurpose } from '@skillnest/shared';

describe('MediaService (Unit - Upload Validation)', () => {
  let mediaService: MediaService;
  let mediaRepository: jest.Mocked<MediaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: MediaRepository,
          useValue: {
            findByChecksumAndOwner: jest.fn(),
            uploadToGridFS: jest.fn(),
            createMediaRecord: jest.fn(),
            findMediaById: jest.fn(),
            getGridFSFileInfo: jest.fn(),
            deleteGridFSFile: jest.fn(),
            deleteMediaRecord: jest.fn(),
          },
        },
      ],
    }).compile();

    mediaService = module.get<MediaService>(MediaService);
    mediaRepository = module.get(MediaRepository);
  });

  it('should reject files exceeding 5MB with PayloadTooLargeException', async () => {
    const oversizeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
    const mockFile = {
      buffer: oversizeBuffer,
      size: oversizeBuffer.length,
      originalname: 'large.png',
      mimetype: 'image/png',
    } as Express.Multer.File;

    await expect(
      mediaService.validateAndUpload(mockFile, new Types.ObjectId().toString(), MediaPurpose.GROUP_COVER),
    ).rejects.toThrow(PayloadTooLargeException);
  });

  it('should reject fake extensions (e.g. text file named image.png) with UnsupportedMediaTypeException', async () => {
    const textBuffer = Buffer.from('this is just a plain text file pretending to be an image');
    const mockFile = {
      buffer: textBuffer,
      size: textBuffer.length,
      originalname: 'fake.png',
      mimetype: 'image/png',
    } as Express.Multer.File;

    await expect(
      mediaService.validateAndUpload(mockFile, new Types.ObjectId().toString(), MediaPurpose.GROUP_COVER),
    ).rejects.toThrow(UnsupportedMediaTypeException);
  });

  it('should accept valid image and upload to GridFS', async () => {
    // Generate valid 10x10 png buffer using sharp
    const validPngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const mockFile = {
      buffer: validPngBuffer,
      size: validPngBuffer.length,
      originalname: 'valid.png',
      mimetype: 'image/png',
    } as Express.Multer.File;

    const mockOwnerId = new Types.ObjectId();
    const mockMediaId = new Types.ObjectId();

    mediaRepository.findByChecksumAndOwner.mockResolvedValue(null);
    mediaRepository.uploadToGridFS
      .mockResolvedValueOnce(new Types.ObjectId())
      .mockResolvedValueOnce(new Types.ObjectId());

    mediaRepository.createMediaRecord.mockResolvedValue({
      _id: mockMediaId,
      ownerId: mockOwnerId,
      purpose: MediaPurpose.GROUP_COVER,
      originalName: 'valid.png',
      mime: 'image/webp',
      size: 100,
      width: 10,
      height: 10,
      createdAt: new Date(),
    } as any);

    const result = await mediaService.validateAndUpload(
      mockFile,
      mockOwnerId.toString(),
      MediaPurpose.GROUP_COVER,
    );

    expect(result).toHaveProperty('id', mockMediaId.toString());
    expect(result.url).toBe(`/api/v1/media/${mockMediaId.toString()}`);
    expect(result.thumbUrl).toBe(`/api/v1/media/${mockMediaId.toString()}/thumb`);
    expect(mediaRepository.uploadToGridFS).toHaveBeenCalledTimes(2);
  });
});
