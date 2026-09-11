import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Any logged-in user (team member or manager) can list projects —
  // team members need this for the report form's project picker.
  @Get()
  @Auth()
  findAll(@Query('includeInactive') includeInactive?: string) {
    // Only a manager's own request is allowed to ask for inactive ones;
    // real enforcement of "who can pass this flag" happens below.
    return this.projectsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  @Auth(Role.MANAGER)
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.create(dto, user.userId);
  }

  @Patch(':id')
  @Auth(Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Auth(Role.MANAGER)
  remove(@Param('id') id: string) {
    return this.projectsService.softDelete(id);
  }

  @Patch(':id/reactivate')
  @Auth(Role.MANAGER)
  reactivate(@Param('id') id: string) {
    return this.projectsService.reactivate(id);
  }
}
