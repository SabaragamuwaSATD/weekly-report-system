import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
