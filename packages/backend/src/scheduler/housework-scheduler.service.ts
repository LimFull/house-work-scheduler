import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseWorkItem } from '../types/notion.types';
import {
  ScheduledHouseWork,
  HouseWorkSchedule,
  HouseWorkRule,
  Frequency,
  DayOfWeek,
} from '../types/scheduler.types';
import { NotionService } from '../notion/notion.service';
import { HouseWorkHistory } from './entities/housework-history.entity';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

@Injectable()
export class HouseWorkSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(HouseWorkSchedulerService.name);
  private schedule: HouseWorkSchedule | null = null;
  private rules: HouseWorkRule[] = [];
  private pastRules: HouseWorkRule[] = [];
  private shouldScheduleUpdate: boolean = false;

  constructor(
    @Inject(forwardRef(() => NotionService))
    private readonly notionService: NotionService,
    @InjectRepository(HouseWorkHistory)
    private readonly houseWorkHistoryRepository: Repository<HouseWorkHistory>,
    @Inject(forwardRef(() => TelegramBotService))
    private readonly telegramBotService: TelegramBotService
  ) {}

  /**
   * 모듈 초기화 시 스케줄을 생성합니다.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('집안일 스케줄러 초기화 시작');
    try {
      await this.refreshSchedule();
      this.logger.log('집안일 스케줄러 초기화 완료');
      // await this.telegramBotService.sendMessage(
      //   '집안일 스케줄러 초기화 완료\n줄바꿈 테스트'
      // );
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
    this.rules = houseWorkItems.map(item => ({
      id: item.id,
      title: item.title,
      days: item.days as DayOfWeek[],
      frequency: item.frequency[0] as Frequency,
      assignee: item.assignee,
      memo: item.memo,
      url: item.url,
      isDone: item.isDone,
      emoji: item.emoji,
    }));

    // this.rules와 this.pastRules를 비교하여 차이가 있는 경우에만 this.shouldScheduleUpdate를 true로 설정
    this.shouldScheduleUpdate = this.rules.some(
      rule => !this.pastRules.some(pastRule => pastRule.id === rule.id)
    );

    this.logger.log(`집안일 규칙 ${this.rules.length}개 설정됨`);
  }

  getShouldScheduleUpdate(): boolean {
    return this.shouldScheduleUpdate;
  }

  private getNextWeekEndDate(currentDate: Date): Date {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  private getNextHouseWorkDate(
    rule: HouseWorkRule,
    startDate?: Date
  ): Date | null {
    const currentDate = startDate || new Date();
    const validUntil = this.getNextWeekEndDate(currentDate);

    // 맞는 요일이 나올 때까지 반복하며 다음 집안일 날짜를 찾음
    while (currentDate <= new Date(validUntil)) {
      const dayOfWeek = this.dayOfWeekNames[currentDate.getDay()];
      if (rule.days.includes(dayOfWeek)) {
        return currentDate;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return null;
  }

  private async getLastHouseWorkDate(
    rule: HouseWorkRule
  ): Promise<Date | null> {
    const lastHouseWorkHistory = await this.houseWorkHistoryRepository.findOne({
      where: {
        title: rule.title,
      },
      order: {
        date: 'DESC', // 날짜를 내림차순으로 정렬하여 가장 마지막 날짜를 찾음
      },
    });

    if (lastHouseWorkHistory) {
      return new Date(lastHouseWorkHistory.date);
    }

    // 저장된 집안일 데이터가 없으면, 가장 가까운 미래의 집안일 날짜를 반환
    if (!lastHouseWorkHistory) {
      return this.getNextHouseWorkDate(rule);
    }

    return null;
  }

  /**
   * 과거 집안일 데이터를 MySQL에 저장합니다.
   */
  async savePastHouseWorks(): Promise<void> {
    const today = new Date();
    const pastItems = this.schedule?.items.filter(
      item => today > new Date(item.date)
    );

    if (!pastItems || pastItems.length === 0) {
      return;
    }

    try {
      const historyEntities = pastItems.map(item => {
        const entity = new HouseWorkHistory();
        entity.houseWorkId = item.id;
        entity.title = item.title;
        entity.assignee = item.assignee;
        entity.memo = item.memo;
        entity.date = item.date;
        entity.dayOfWeek = item.dayOfWeek;
        entity.originalHouseWorkId = item.originalHouseWorkId;
        entity.url = item.url;
        entity.isDone = item.isDone;
        entity.scheduledDate = new Date();
        return entity;
      });

      // 중복 방지를 위해 기존 데이터 확인 후 저장
      for (const entity of historyEntities) {
        const existing = await this.houseWorkHistoryRepository.findOne({
          where: {
            date: entity.date,
            originalHouseWorkId: entity.originalHouseWorkId,
          },
        });

        if (!existing) {
          await this.houseWorkHistoryRepository.save(entity);
        }
      }

      this.logger.log(`과거 집안일 ${historyEntities.length}개 저장됨`);
    } catch (error) {
      this.logger.error('과거 집안일 저장 실패:', error);
    }
  }

  removePastHouseWorksFromMemory(): void {
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (!this.schedule) {
      return;
    }

    this.schedule.items = this.schedule.items.filter(item => {
      const itemDate = new Date(item.date);
      const itemDateOnly = new Date(
        itemDate.getFullYear(),
        itemDate.getMonth(),
        itemDate.getDate()
      );
      return todayDateOnly > itemDateOnly;
    });
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
      const lastHouseWorkDate = await this.getLastHouseWorkDate(rule);

      // rule이 존재하면, 정상적인 경우라면 lastHouseWorkDate가 존재해야 함
      if (!lastHouseWorkDate) {
        continue;
      }

      const ruleSchedules = this.generateScheduleForRule(
        rule,
        lastHouseWorkDate,
        validUntil
      );
      scheduledItems.push(...ruleSchedules);
    }

    // 날짜순으로 정렬
    scheduledItems.sort((a, b) => a.date.localeCompare(b.date));

    // 과거 데이터와 현재/미래 데이터 분리
    const pastItems = scheduledItems.filter(item => item.date < todayString);
    const currentAndFutureItems = scheduledItems.filter(
      item => item.date >= todayString
    );

    this.schedule = {
      items: currentAndFutureItems,
      lastUpdated: new Date().toISOString(),
      validUntil: validUntil.toISOString().split('T')[0],
    };

    this.logger.log(
      `스케줄 생성 완료: 현재/미래 ${currentAndFutureItems.length}개, 과거 ${pastItems.length}개 저장됨`
    );
    return this.schedule;
  }

  /**
   * id에 해당하는 스케줄을 가능한 다음 날짜로 미루고, 그 날짜에 이미 같은 title의 스케줄이 있으면 미루지 않고 제거합니다.
   */
  delayScheduleDate(id: string): boolean {
    const schedule = this.schedule?.items.find(item => item.id === id);
    const startDate = new Date(schedule?.date || '');
    const startDateOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );

    if (!schedule) {
      return false;
    }

    const rule = this.rules.find(
      rule => rule.id === schedule?.originalHouseWorkId
    );
    if (!rule) {
      return false;
    }

    const days = rule.days;

    const schedules = this.schedule?.items.filter(item => {
      const itemDate = new Date(item.date);
      const itemDateOnly = new Date(
        itemDate.getFullYear(),
        itemDate.getMonth(),
        itemDate.getDate()
      );

      return (
        item.originalHouseWorkId === rule.id && itemDateOnly > startDateOnly
      );
    });

    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + 1);

    while (!days.includes(this.dayOfWeekNames[nextDate.getDay()])) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    this.telegramBotService.sendMessage(
      `스케줄 미루기: ${schedule.emoji} ${schedule.title}\n${startDate.toISOString().split('T')[0]} (${this.dayOfWeekNames[startDate.getDay()]}) -> ${nextDate.toISOString().split('T')[0]} (${this.dayOfWeekNames[nextDate.getDay()]})`
    );

    // 그 날짜에 이미 같은 title의 스케줄이 있으면 미루지 않고 제거
    if (
      (schedules?.length ?? 0) > 0 &&
      schedules?.[0].date === nextDate.toISOString().split('T')[0] &&
      this.schedule
    ) {
      this.schedule.items = this.schedule.items.filter(
        item => item.id !== schedule.id
      );
      return true;
    }

    // 다음 날짜로 미루기
    schedule.date = nextDate.toISOString().split('T')[0];
    return true;
  }

  /**
   * 특정 규칙에 대한 스케줄을 생성합니다.
   */
  private generateScheduleForRule(
    rule: HouseWorkRule,
    startDate: Date,
    endDate: Date
  ): ScheduledHouseWork[] {
    const schedules: ScheduledHouseWork[] = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(currentDate);
    // while (currentDate <= endDate && rule.title === '방쓸기') {
    while (currentDate <= endDate) {
      const dayOfWeek = this.dayOfWeekNames[currentDate.getDay()];

      // 해당 요일에 집안일이 있는지 확인
      if (rule.days.includes(dayOfWeek)) {
        // 빈도에 따라 스케줄 추가
        if (this.shouldAddToSchedule(rule.frequency, currentDate, lastDate)) {
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
            emoji: rule.emoji,
          });
          lastDate.setDate(currentDate.getDate());
          lastDate.setMonth(currentDate.getMonth());
          lastDate.setFullYear(currentDate.getFullYear());
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
    startDate: Date
  ): boolean {
    const daysDiff = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthDiff = currentDate.getMonth() - startDate.getMonth();

    // 동일한 날이면 true 반환
    if (daysDiff === 0) {
      return true;
    }

    switch (frequency) {
      case '매일':
        return true;
      case '격일':
        return daysDiff >= 2;
      case '매주':
        return daysDiff >= 7;
      case '격주':
        return daysDiff >= 14;
      case '매달':
        return monthDiff >= 1;
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
    return this.schedule.items.filter(item => item.date === date);
  }

  /**
   * 특정 기간의 스케줄을 반환합니다.
   */
  getScheduleForPeriod(
    startDate: string,
    endDate: string
  ): ScheduledHouseWork[] {
    if (!this.schedule) {
      return [];
    }
    return this.schedule.items.filter(
      item => item.date >= startDate && item.date <= endDate
    );
  }

  /**
   * 과거 집안일 데이터를 조회합니다.
   */
  async getPastHouseWorks(
    startDate: string,
    endDate: string
  ): Promise<HouseWorkHistory[]> {
    try {
      const pastWorks = await this.houseWorkHistoryRepository
        .createQueryBuilder('history')
        .where('history.date >= :startDate', { startDate })
        .andWhere('history.date <= :endDate', { endDate })
        .orderBy('history.date', 'ASC')
        .getMany();

      return pastWorks;
    } catch (error) {
      this.logger.error('과거 집안일 조회 실패:', error);
      return [];
    }
  }

  /**
   * 월별 스케줄을 조회합니다.
   * 과거 데이터는 MySQL에서, 현재/미래 데이터는 스케줄러에서 가져옵니다.
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

    // 과거 데이터 조회 (MySQL에서)
    if (startDateString < todayString) {
      const pastEndDate =
        endDateString < todayString ? endDateString : todayString;
      const pastWorks = await this.getPastHouseWorks(
        startDateString,
        pastEndDate
      );

      // MySQL 데이터를 ScheduledHouseWork 형태로 변환
      const pastScheduledWorks: ScheduledHouseWork[] = pastWorks.map(
        work =>
          ({
            id: work.houseWorkId,
            title: work.title,
            assignee: work.assignee,
            memo: work.memo,
            date: work.date,
            dayOfWeek: work.dayOfWeek,
            originalHouseWorkId: work.originalHouseWorkId,
            url: work.url,
            isDone: work.isDone,
            source: 'database', // 데이터 출처 표시
            emoji: work.emoji,
          }) as ScheduledHouseWork
      );

      monthlySchedule.push(...pastScheduledWorks);
    }

    // 현재/미래 데이터 조회 (스케줄러에서)
    if (endDateString >= todayString) {
      const currentStartDate =
        startDateString >= todayString ? startDateString : todayString;
      const currentWorks = this.getScheduleForPeriod(
        currentStartDate,
        endDateString
      );

      // 스케줄러 데이터에 출처 표시 추가
      const currentScheduledWorks = currentWorks.map(work => ({
        ...work,
        source: 'scheduler', // 데이터 출처 표시
      }));

      monthlySchedule.push(...currentScheduledWorks);
    }

    // 날짜순으로 정렬
    monthlySchedule.sort((a, b) => a.date.localeCompare(b.date));

    this.logger.log(
      `${year}년 ${month}월 스케줄 조회: ${monthlySchedule.length}개 항목`
    );

    return monthlySchedule;
  }

  /**
   * 특정 스케줄 항목의 완료 상태와 담당자를 변경합니다.
   */
  updateDoneStatus(
    id: string,
    isDone: boolean,
    assignee?: string
  ): ScheduledHouseWork | null {
    if (!this.schedule) {
      return null;
    }

    const item = this.schedule.items.find(item => item.id === id);
    if (!item) {
      return null;
    }

    item.isDone = isDone;
    if (assignee !== undefined) {
      item.assignee = assignee;
    }

    this.logger.log(
      `스케줄 항목 ${id} 업데이트: 완료=${isDone}, 담당자=${assignee || '변경없음'}`
    );

    return item;
  }

  /**
   * 스케줄을 새로고침합니다 (6시간마다 실행).
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshSchedule(): Promise<void> {
    this.logger.log('스케줄 새로고침 시작');

    try {
      await this.savePastHouseWorks();
      this.removePastHouseWorksFromMemory();
    } catch (error) {
      this.logger.error('과거 집안일 저장 실패:', error);
    }

    try {
      await this.notionService.updateSchedulerFromNotion();
      this.logger.log('스케줄 새로고침 완료');
    } catch (error) {
      this.logger.error('스케줄 새로고침 실패:', error);
    }
  }

  /**
   * 매일 오후 6시에 집안일 메시지를 보냅니다.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async sendDailyMessage(): Promise<void> {
    const today = new Date();
    const todayScheduleItems = this.schedule?.items.filter(
      item => item.date === today.toISOString().split('T')[0]
    );

    const manScheduleItems = todayScheduleItems?.filter(
      item => item.assignee === '👦🏻'
    );
    const womanScheduleItems = todayScheduleItems?.filter(
      item => item.assignee === '👧🏻'
    );
    const togetherScheduleItems = todayScheduleItems?.filter(
      item => item.assignee === '👦🏻👧🏻'
    );

    const manMessage =
      (manScheduleItems?.length ?? 0) > 0
        ? `👦🏻\n${manScheduleItems?.map(item => item.title).join('\n')}`
        : '';
    const womanMessage =
      (womanScheduleItems?.length ?? 0) > 0
        ? `👧🏻\n${womanScheduleItems?.map(item => item.title).join('\n')}`
        : '';
    const togetherMessage =
      (togetherScheduleItems?.length ?? 0) > 0
        ? `👦🏻👧🏻\n${togetherScheduleItems?.map(item => item.title).join('\n')}`
        : '';
    const messages = [manMessage, womanMessage, togetherMessage].filter(
      message => message !== ''
    );
    const message = messages.join('\n\n');

    await this.telegramBotService.sendMessage(message);
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

  /**
   * 일회성 집안일을 추가합니다.
   */
  addOneTimeSchedule(
    title: string,
    assignee: string,
    date: string,
    memo?: string,
    emoji?: string
  ): ScheduledHouseWork {
    if (!this.schedule) {
      throw new Error('스케줄이 초기화되지 않았습니다');
    }

    // UUID 생성 (간단한 방법)
    const uuid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dateObj = new Date(date);
    const dayOfWeek = this.dayOfWeekNames[dateObj.getDay()];

    const oneTimeSchedule: ScheduledHouseWork = {
      id: `one-time-${uuid}_${date}`,
      title,
      assignee,
      memo: memo || '',
      date,
      dayOfWeek,
      originalHouseWorkId: `one-time-${uuid}`,
      url: '',
      isDone: false,
      emoji: emoji || '📝',
    };

    this.schedule.items.push(oneTimeSchedule);

    // 날짜순으로 재정렬
    this.schedule.items.sort((a, b) => a.date.localeCompare(b.date));

    this.logger.log(`일회성 집안일 추가: ${title} (${date})`);

    return oneTimeSchedule;
  }

  /**
   * 특정 스케줄을 삭제합니다.
   */
  deleteSchedule(id: string): boolean {
    if (!this.schedule) {
      return false;
    }

    const initialLength = this.schedule.items.length;
    this.schedule.items = this.schedule.items.filter(item => item.id !== id);

    const deleted = this.schedule.items.length < initialLength;

    if (deleted) {
      this.logger.log(`스케줄 삭제: ${id}`);
    }

    return deleted;
  }
}
