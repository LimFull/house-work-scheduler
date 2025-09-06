export interface ScheduledHouseWork {
    id: string;
    title: string;
    assignee: string;
    memo: string;
    date: string;
    dayOfWeek: string;
    originalHouseWorkId: string;
    url: string;
    isDone: boolean;
    source?: 'database' | 'scheduler';
    emoji: string;
  }