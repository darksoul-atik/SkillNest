import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { UserProfile } from '@skillnest/shared';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiResponse({ status: 200, description: 'User public profile' })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<UserProfile> {
    return this.usersService.getPublicProfile(id);
  }
}
