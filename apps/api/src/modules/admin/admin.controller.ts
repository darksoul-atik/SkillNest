import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { UserRole, UserResponse, CursorPaginationMeta } from '@skillnest/shared';
import { CursorPaginationQueryDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get paginated list of users (Admin only)' })
  async getUsers(
    @Query() query: CursorPaginationQueryDto,
  ): Promise<{ data: UserResponse[]; meta: CursorPaginationMeta }> {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  async updateUserRole(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<UserResponse> {
    return this.adminService.updateUserRole(id, dto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user active status (Admin only)' })
  async updateUserStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserResponse> {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system counts & stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform statistics' })
  async getStats() {
    return this.adminService.getStats();
  }
}
