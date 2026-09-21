import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CreateReplyDto,
  UpdateReplyDto,
} from './dto/comment.dto';
import { CommentsService } from './comments.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('groups/:id/comments')
  async getComments(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commentsService.findCommentsByGroupId(
      id,
      limit ? parseInt(limit, 10) : undefined,
      cursor,
      user?.sub,
      user?.role,
    );
  }

  @Post('groups/:id/comments')
  async createComment(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() input: CreateCommentDto,
  ) {
    return this.commentsService.createComment(id, user.sub, input);
  }

  @Patch('comments/:id')
  async updateComment(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() input: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, user.sub, user.role, input);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.commentsService.deleteComment(id, user.sub, user.role);
  }

  @Public()
  @Get('comments/:id/replies')
  async getReplies(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commentsService.findRepliesByCommentId(id, user?.sub);
  }

  @Post('comments/:id/replies')
  async createReply(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() input: CreateReplyDto,
  ) {
    return this.commentsService.createReply(id, user.sub, user.role, input);
  }

  @Patch('replies/:id')
  async updateReply(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() input: UpdateReplyDto,
  ) {
    return this.commentsService.updateReply(id, user.sub, user.role, input);
  }

  @Delete('replies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReply(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.commentsService.deleteReply(id, user.sub, user.role);
  }
}
