import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserSummaryDto } from './dto/user-summary.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/role.enum';
import type { UserDocument } from './schemas/user.schema';

function toSummary(user: UserDocument): UserSummaryDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Manager-only: powers the dashboard's team-member filter and the
  // team member profile page. Team members never need a full roster.
  @Get()
  @Auth(Role.MANAGER)
  async findAll(): Promise<UserSummaryDto[]> {
    const users = await this.usersService.findAll();
    return users.map(toSummary);
  }

  @Get(':id')
  @Auth(Role.MANAGER)
  async findOne(@Param('id') id: string): Promise<UserSummaryDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toSummary(user);
  }
}
