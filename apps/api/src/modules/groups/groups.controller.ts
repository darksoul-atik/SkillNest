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
import { GroupCategory, GroupStatus } from '@skillnest/shared';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: GroupCategory,
    @Query('status') status?: GroupStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.groupsService.findAll(
      {
        category,
        status,
        search,
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor,
      },
      user?.sub,
    );
  }

  @Get('user/me')
  async getMyGroups(@CurrentUser() user: JwtPayload) {
    return this.groupsService.getUserGroups(user.sub);
  }

  @Public()
  @Get(':idOrSlug')
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.groupsService.findBySlugOrId(idOrSlug, user?.sub);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() input: CreateGroupDto,
  ) {
    return this.groupsService.create(user.sub, input);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() input: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, user.sub, user.role, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.groupsService.delete(id, user.sub, user.role);
  }

  @Public()
  @Get(':id/members')
  async getMembers(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.groupsService.getMembers(
      id,
      limit ? parseInt(limit, 10) : undefined,
      cursor,
    );
  }

  @Post(':id/members')
  async join(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.join(id, user.sub);
  }

  @Delete(':id/members/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.groupsService.leave(id, user.sub);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.groupsService.removeMember(id, userId, user.sub, user.role);
  }
}
