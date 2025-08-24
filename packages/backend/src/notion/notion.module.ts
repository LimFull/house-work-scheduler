import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [HttpModule, forwardRef(() => SchedulerModule)],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}
