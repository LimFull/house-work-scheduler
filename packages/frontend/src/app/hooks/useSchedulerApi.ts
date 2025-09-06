import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserType } from '../contexts/UserProfileContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 스케줄러 API 타입들
interface ScheduledHouseWork {
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

interface MonthlyScheduleResponse {
  success: boolean;
  data: ScheduledHouseWork[];
  count: number;
  period: { year: string; month: string };
}

// 스케줄러 상태 조회
export const useSchedulerStatus = () => {
  return useQuery({
    queryKey: ['scheduler', 'status'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/scheduler/status`);
      if (!response.ok) {
        throw new Error('스케줄러 상태 조회 실패');
      }
      return response.json();
    },
  });
};

// 전체 스케줄 조회
export const useSchedule = () => {
  return useQuery({
    queryKey: ['scheduler', 'schedule'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/scheduler/schedule`);
      if (!response.ok) {
        throw new Error('스케줄 조회 실패');
      }
      return response.json();
    },
  });
};

// 특정 날짜 스케줄 조회
export const useScheduleForDate = (date: string) => {
  return useQuery({
    queryKey: ['scheduler', 'schedule', 'date', date],
    queryFn: async (): Promise<ScheduledHouseWork[]> => {
      const response = await fetch(
        `${API_BASE_URL}/scheduler/schedule/${date}`
      );
      if (!response.ok) {
        throw new Error('날짜별 스케줄 조회 실패');
      }
      return response.json();
    },
    enabled: !!date,
  });
};

// 기간별 스케줄 조회
export const useScheduleForPeriod = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['scheduler', 'schedule', 'period', startDate, endDate],
    queryFn: async (): Promise<ScheduledHouseWork[]> => {
      const response = await fetch(
        `${API_BASE_URL}/scheduler/schedule/${startDate}/${endDate}`
      );
      if (!response.ok) {
        throw new Error('기간별 스케줄 조회 실패');
      }
      return response.json();
    },
    enabled: !!startDate && !!endDate,
  });
};

// 월별 스케줄 조회
export const useMonthlySchedule = (year: number, month: number) => {
  return useQuery({
    queryKey: ['scheduler', 'monthly', year, month],
    queryFn: async (): Promise<MonthlyScheduleResponse> => {
      const response = await fetch(
        `${API_BASE_URL}/scheduler/monthly/${year}/${month}`
      );
      if (!response.ok) {
        throw new Error('월별 스케줄 조회 실패');
      }
      return response.json();
    },
    enabled: !!year && !!month,
  });
};

// 과거 집안일 조회
export const usePastHouseWorks = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['scheduler', 'history', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/scheduler/history/${startDate}/${endDate}`
      );
      if (!response.ok) {
        throw new Error('과거 집안일 조회 실패');
      }
      return response.json();
    },
    enabled: !!startDate && !!endDate,
  });
};

// 완료 상태 업데이트
export const useUpdateDoneStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isDone,
      assignee,
    }: {
      id: string;
      isDone: boolean;
      assignee?: UserType;
    }): Promise<ScheduledHouseWork> => {
      const response = await fetch(
        `${API_BASE_URL}/scheduler/schedule/${id}/done`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isDone, assignee }),
        }
      );

      if (!response.ok) {
        throw new Error('완료 상태 업데이트 실패');
      }

      return response.json();
    },
    onSuccess: data => {
      // 관련된 모든 스케줄 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'schedule'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'monthly'] });

      // 특정 날짜 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: ['scheduler', 'schedule', 'date', data.date],
      });
    },
  });
};

// 스케줄 새로고침
export const useRefreshSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/scheduler/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('스케줄 새로고침 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      // 모든 스케줄 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['scheduler'] });
    },
  });
};
