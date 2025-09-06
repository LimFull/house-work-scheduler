import { Controller, Get, Param, Post, Put, Body } from '@nestjs/common';
import { HouseWorkSchedulerService } from './housework-scheduler.service';
import {
  HouseWorkSchedule,
  ScheduledHouseWork,
} from '../types/scheduler.types';

interface UpdateDoneStatusDto {
  isDone: boolean;
  assignee?: string;
}

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: HouseWorkSchedulerService) {}

  @Get('status')
  getStatus() {
    return this.schedulerService.getScheduleStatus();
  }

  @Get('schedule')
  getSchedule(): HouseWorkSchedule | null {
    return this.schedulerService.getSchedule();
  }

  @Get('schedule/:date')
  getScheduleForDate(@Param('date') date: string): ScheduledHouseWork[] {
    return this.schedulerService.getScheduleForDate(date);
  }

  @Get('schedule/:startDate/:endDate')
  getScheduleForPeriod(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string
  ): ScheduledHouseWork[] {
    return this.schedulerService.getScheduleForPeriod(startDate, endDate);
  }

  @Get('monthly/:year/:month')
  async getMonthlySchedule(
    @Param('year') year: string,
    @Param('month') month: string
  ) {
    const monthlySchedule = await this.schedulerService.getMonthlySchedule(
      parseInt(year),
      parseInt(month)
    );
    return {
      success: true,
      data: monthlySchedule,
      count: monthlySchedule.length,
      period: { year, month },
    };
  }

  @Get('history/:startDate/:endDate')
  async getPastHouseWorks(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string
  ) {
    const pastWorks = await this.schedulerService.getPastHouseWorks(
      startDate,
      endDate
    );
    return {
      success: true,
      data: pastWorks,
      count: pastWorks.length,
      period: { startDate, endDate },
    };
  }

  @Put('schedule/:id/done')
  updateDoneStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateDoneStatusDto
  ) {
    return this.schedulerService.updateDoneStatus(
      id,
      updateDto.isDone,
      updateDto.assignee
    );
  }

  @Post('refresh')
  async refreshSchedule() {
    await this.schedulerService.refreshSchedule();
    return { message: '스케줄 새로고침 완료' };
  }

  /**
   * id에 해당하는 스케쥴을 가능한 다음 날짜로 미루고, 이후 스케줄들도 재설정한다.
   */
  @Put('schedule/:id/delay')
  delaySchedule(@Param('id') id: string) {
    return this.schedulerService.delayScheduleDate(id);
  }
}
