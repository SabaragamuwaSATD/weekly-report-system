import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Only team members author reports, per Section 2 of the spec
  @Post()
  @Auth(Role.TEAM_MEMBER)
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.create(user.userId, dto);
  }

  // Any authenticated user can list — the service scopes what they actually see
  @Get()
  @Auth()
  findAll(
    @Query() query: QueryReportsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.findAll(user, query);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getOne(id, user);
  }

  @Patch(':id')
  @Auth(Role.TEAM_MEMBER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.update(id, user.userId, dto);
  }

  @Post(':id/submit')
  @Auth(Role.TEAM_MEMBER)
  submit(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.submit(id, user.userId);
  }

  @Post(':id/review')
  @Auth(Role.MANAGER)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.review(id, user.userId, dto);
  }

  @Get(':id/history')
  @Auth()
  getHistory(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getVersionHistory(id, user);
  }
}
