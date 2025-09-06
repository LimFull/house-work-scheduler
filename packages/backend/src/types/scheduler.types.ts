// 스케줄러 관련 타입 정의

export interface ScheduledHouseWork {
  id: string;
  title: string;
  assignee: string;
  memo: string;
  date: string; // YYYY-MM-DD 형식
  dayOfWeek: string; // 요일 (월, 화, 수, 목, 금, 토, 일)
  originalHouseWorkId: string; // 원본 집안일 ID
  url: string; // Notion 페이지 URL
  isDone: boolean; // 완료 여부
  emoji: string; // 이모지
}

export interface HouseWorkSchedule {
  items: ScheduledHouseWork[];
  lastUpdated: string;
  validUntil: string; // 스케줄이 유효한 날짜 (다음달 말일)
}

export type Frequency = '격일' | '매일' | '매달' | '매주' | '격주';
export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface HouseWorkRule {
  id: string;
  title: string;
  days: DayOfWeek[];
  frequency: Frequency;
  assignee: string;
  memo: string;
  url: string;
  isDone: boolean; // 완료 여부
  emoji: string; // 이모지
}
