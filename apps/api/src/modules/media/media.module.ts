import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Media, MediaSchema } from './schemas/media.schema';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    ScheduleModule.forRoot(),
  ],
  controllers: [MediaController],
  providers: [MediaRepository, MediaService],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
