import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { HouseWorkSchedulerService } from './housework-scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { NotionModule } from '../notion/notion.module';
import {
  HouseWorkHistory,
  HouseWorkHistorySchema,
} from './schemas/housework-history.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => NotionModule),
    MongooseModule.forFeature([
      { name: HouseWorkHistory.name, schema: HouseWorkHistorySchema },
    ]),
  ],
  controllers: [SchedulerController],
  providers: [HouseWorkSchedulerService],
  exports: [HouseWorkSchedulerService],
})
export class SchedulerModule {}
