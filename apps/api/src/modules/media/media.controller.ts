import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { MediaService } from './media.service';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaPurpose, MediaResponse } from '@skillnest/shared';
import { UploadMediaDto } from './dto/media.dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiBearerAuth()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        purpose: { type: 'string', enum: Object.values(MediaPurpose), default: MediaPurpose.GROUP_COVER },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload and process image to GridFS storage' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Query() query: UploadMediaDto,
  ): Promise<MediaResponse> {
    return this.mediaService.validateAndUpload(file, userId, query.purpose);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Stream full-size media from GridFS' })
  async getMedia(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.mediaService.streamMedia(id, false, req, res);
  }

  @Public()
  @Get(':id/thumb')
  @ApiOperation({ summary: 'Stream thumbnail media variant from GridFS' })
  async getThumb(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.mediaService.streamMedia(id, true, req, res);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete media asset (Owner or Admin)' })
  async deleteMedia(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<void> {
    await this.mediaService.deleteMedia(id, user);
  }
}
