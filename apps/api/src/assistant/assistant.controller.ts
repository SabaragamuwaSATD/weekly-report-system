import { Body, Controller, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AskDto } from './dto/ask.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  // Manager-only: the whole point is cross-team visibility a team member
  // shouldn't have (this mirrors the RBAC boundary on /reports and /users).
  @Post('ask')
  @Auth(Role.MANAGER)
  ask(@Body() dto: AskDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assistantService.ask(dto.question, user);
  }
}
