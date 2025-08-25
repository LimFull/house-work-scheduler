import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseWorkSchedulerService } from './housework-scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { NotionModule } from '../notion/notion.module';
import { HouseWorkHistory } from './entities/housework-history.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => NotionModule),
    TypeOrmModule.forFeature([HouseWorkHistory]),
  ],
  controllers: [SchedulerController],
  providers: [HouseWorkSchedulerService],
  exports: [HouseWorkSchedulerService],
})
export class SchedulerModule {}
