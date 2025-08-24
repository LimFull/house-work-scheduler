import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HouseWorkItem } from '../types/notion.types';
import {
  ScheduledHouseWork,
  HouseWorkSchedule,
  HouseWorkRule,
  Frequency,
  DayOfWeek,
} from '../types/scheduler.types';
import { NotionService } from '../notion/notion.service';
import {
  HouseWorkHistory,
  HouseWorkHistoryDocument,
} from './schemas/housework-history.schema';

@Injectable()
export class HouseWorkSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(HouseWorkSchedulerService.name);
  private schedule: HouseWorkSchedule | null = null;
  private rules: HouseWorkRule[] = [];

  constructor(
    @Inject(forwardRef(() => NotionService))
    private readonly notionService: NotionService,
    @InjectModel(HouseWorkHistory.name)
    private readonly houseWorkHistoryModel: Model<HouseWorkHistoryDocument>,
  ) {}

  /**
   * 모듈 초기화 시 스케줄을 생성합니다.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('집안일 스케줄러 초기화 시작');
    try {
      await this.refreshSchedule();
      this.logger.log('집안일 스케줄러 초기화 완료');
    } catch (error) {
      this.logger.error('집안일 스케줄러 초기화 실패:', error);
    }
  }

  // 요일 매핑
  private readonly dayOfWeekMap: Record<DayOfWeek, number> = {
    월: 1,
    화: 2,
    수: 3,
    목: 4,
    금: 5,
    토: 6,
    일: 0,
  };

  private readonly dayOfWeekNames: Record<number, DayOfWeek> = {
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토',
    0: '일',
  };

  /**
   * 집안일 규칙을 설정합니다.
   */
  setRules(houseWorkItems: HouseWorkItem[]): void {
    this.rules = houseWorkItems.map((item) => ({
      id: item.id,
      title: item.title,
      days: item.days as DayOfWeek[],
      frequency: item.frequency[0] as Frequency,
      assignee: item.assignee,
      memo: item.memo,
      url: item.url,
      isDone: item.isDone,
    }));

    this.logger.log(`집안일 규칙 ${this.rules.length}개 설정됨`);
  }

  /**
   * 과거 집안일 데이터를 MongoDB에 저장합니다.
   */
  private async savePastHouseWorks(
    pastItems: ScheduledHouseWork[],
  ): Promise<void> {
    if (pastItems.length === 0) {
      return;
    }

    try {
      const historyDocuments = pastItems.map((item) => ({
        id: item.id,
        title: item.title,
        assignee: item.assignee,
        memo: item.memo,
        date: item.date,
        dayOfWeek: item.dayOfWeek,
        originalHouseWorkId: item.originalHouseWorkId,
        url: item.url,
        isDone: item.isDone,
        scheduledDate: new Date(),
      }));

      // bulkWrite를 사용하여 중복 방지하면서 저장
      const operations = historyDocuments.map((doc) => ({
        updateOne: {
          filter: {
            date: doc.date,
            originalHouseWorkId: doc.originalHouseWorkId,
          },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      const result = await this.houseWorkHistoryModel.bulkWrite(operations);
      this.logger.log(`과거 집안일 ${result.upsertedCount}개 저장됨`);
    } catch (error) {
      this.logger.error('과거 집안일 저장 실패:', error);
    }
  }

  /**
   * 스케줄을 생성합니다.
   */
  async generateSchedule(): Promise<HouseWorkSchedule> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const validUntil = this.getNextMonthEndDate(today);

    const scheduledItems: ScheduledHouseWork[] = [];

    for (const rule of this.rules) {
      const ruleSchedules = this.generateScheduleForRule(
        rule,
        today,
        validUntil,
      );
      scheduledItems.push(...ruleSchedules);
    }

    // 날짜순으로 정렬
    scheduledItems.sort((a, b) => a.date.localeCompare(b.date));

    // 과거 데이터와 현재/미래 데이터 분리
    const pastItems = scheduledItems.filter((item) => item.date < todayString);
    const currentAndFutureItems = scheduledItems.filter(
      (item) => item.date >= todayString,
    );

    // 과거 데이터를 MongoDB에 저장
    await this.savePastHouseWorks(pastItems);

    this.schedule = {
      items: currentAndFutureItems,
      lastUpdated: new Date().toISOString(),
      validUntil: validUntil.toISOString().split('T')[0],
    };

    this.logger.log(
      `스케줄 생성 완료: 현재/미래 ${currentAndFutureItems.length}개, 과거 ${pastItems.length}개 저장됨`,
    );
    return this.schedule;
  }

  /**
   * 특정 규칙에 대한 스케줄을 생성합니다.
   */
  private generateScheduleForRule(
    rule: HouseWorkRule,
    startDate: Date,
    endDate: Date,
  ): ScheduledHouseWork[] {
    const schedules: ScheduledHouseWork[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.dayOfWeekNames[currentDate.getDay()];

      // 해당 요일에 집안일이 있는지 확인
      if (rule.days.includes(dayOfWeek)) {
        // 빈도에 따라 스케줄 추가
        if (this.shouldAddToSchedule(rule.frequency, currentDate, startDate)) {
          schedules.push({
            id: `${rule.id}_${currentDate.toISOString().split('T')[0]}`,
            title: rule.title,
            assignee: rule.assignee,
            memo: rule.memo,
            date: currentDate.toISOString().split('T')[0],
            dayOfWeek,
            originalHouseWorkId: rule.id,
            url: rule.url,
            isDone: rule.isDone,
          });
        }
      }

      // 다음 날로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
  }

  /**
   * 빈도에 따라 스케줄에 추가할지 결정합니다.
   */
  private shouldAddToSchedule(
    frequency: Frequency,
    currentDate: Date,
    startDate: Date,
  ): boolean {
    const daysDiff = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    switch (frequency) {
      case '매일':
        return true;
      case '격일':
        return daysDiff % 2 === 0;
      case '매주':
        return daysDiff % 7 === 0;
      case '격주':
        return daysDiff % 14 === 0;
      case '매달':
        return currentDate.getDate() === startDate.getDate();
      default:
        return false;
    }
  }

  /**
   * 다음달 말일을 계산합니다.
   */
  private getNextMonthEndDate(currentDate: Date): Date {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 2);
    nextMonth.setDate(0); // 이전 달의 마지막 날
    return nextMonth;
  }

  /**
   * 현재 스케줄을 반환합니다.
   */
  getSchedule(): HouseWorkSchedule | null {
    return this.schedule;
  }

  /**
   * 특정 날짜의 스케줄을 반환합니다.
   */
  getScheduleForDate(date: string): ScheduledHouseWork[] {
    if (!this.schedule) {
      return [];
    }
    return this.schedule.items.filter((item) => item.date === date);
  }

  /**
   * 특정 기간의 스케줄을 반환합니다.
   */
  getScheduleForPeriod(
    startDate: string,
    endDate: string,
  ): ScheduledHouseWork[] {
    if (!this.schedule) {
      return [];
    }
    return this.schedule.items.filter(
      (item) => item.date >= startDate && item.date <= endDate,
    );
  }

  /**
   * 과거 집안일 데이터를 조회합니다.
   */
  async getPastHouseWorks(
    startDate: string,
    endDate: string,
  ): Promise<HouseWorkHistory[]> {
    try {
      const pastWorks = await this.houseWorkHistoryModel
        .find({
          date: { $gte: startDate, $lte: endDate },
        })
        .sort({ date: 1 })
        .exec();

      return pastWorks;
    } catch (error) {
      this.logger.error('과거 집안일 조회 실패:', error);
      return [];
    }
  }

  /**
   * 월별 스케줄을 조회합니다.
   * 과거 데이터는 MongoDB에서, 현재/미래 데이터는 스케줄러에서 가져옵니다.
   */
  async getMonthlySchedule(year: number, month: number): Promise<any[]> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // 해당 월의 시작일과 마지막일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    const monthlySchedule: any[] = [];

    // 과거 데이터 조회 (MongoDB에서)
    if (startDateString < todayString) {
      const pastEndDate =
        endDateString < todayString ? endDateString : todayString;
      const pastWorks = await this.getPastHouseWorks(
        startDateString,
        pastEndDate,
      );

      // MongoDB 데이터를 ScheduledHouseWork 형태로 변환
      const pastScheduledWorks = pastWorks.map((work) => ({
        id: work.id,
        title: work.title,
        assignee: work.assignee,
        memo: work.memo,
        date: work.date,
        dayOfWeek: work.dayOfWeek,
        originalHouseWorkId: work.originalHouseWorkId,
        url: work.url,
        isDone: work.isDone,
        source: 'database', // 데이터 출처 표시
      }));

      monthlySchedule.push(...pastScheduledWorks);
    }

    // 현재/미래 데이터 조회 (스케줄러에서)
    if (endDateString >= todayString) {
      const currentStartDate =
        startDateString >= todayString ? startDateString : todayString;
      const currentWorks = this.getScheduleForPeriod(
        currentStartDate,
        endDateString,
      );

      // 스케줄러 데이터에 출처 표시 추가
      const currentScheduledWorks = currentWorks.map((work) => ({
        ...work,
        source: 'scheduler', // 데이터 출처 표시
      }));

      monthlySchedule.push(...currentScheduledWorks);
    }

    // 날짜순으로 정렬
    monthlySchedule.sort((a, b) => a.date.localeCompare(b.date));

    this.logger.log(
      `${year}년 ${month}월 스케줄 조회: ${monthlySchedule.length}개 항목`,
    );

    return monthlySchedule;
  }

  /**
   * 특정 스케줄 항목의 완료 상태를 변경합니다.
   */
  updateDoneStatus(id: string, isDone: boolean): ScheduledHouseWork | null {
    if (!this.schedule) {
      return null;
    }

    const item = this.schedule.items.find((item) => item.id === id);
    if (!item) {
      return null;
    }

    item.isDone = isDone;
    this.logger.log(`스케줄 항목 ${id} 완료 상태 변경: ${isDone}`);

    return item;
  }

  /**
   * 스케줄을 새로고침합니다 (6시간마다 실행).
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshSchedule(): Promise<void> {
    this.logger.log('스케줄 새로고침 시작');

    try {
      await this.notionService.updateSchedulerFromNotion();
      this.logger.log('스케줄 새로고침 완료');
    } catch (error) {
      this.logger.error('스케줄 새로고침 실패:', error);
    }
  }

  /**
   * 스케줄 상태를 반환합니다.
   */
  getScheduleStatus(): {
    hasSchedule: boolean;
    itemCount: number;
    lastUpdated: string | null;
    validUntil: string | null;
  } {
    return {
      hasSchedule: this.schedule !== null,
      itemCount: this.schedule?.items.length || 0,
      lastUpdated: this.schedule?.lastUpdated || null,
      validUntil: this.schedule?.validUntil || null,
    };
  }
}
