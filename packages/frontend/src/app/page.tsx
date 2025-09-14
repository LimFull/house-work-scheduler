'use client';

import { useState } from 'react';
import Day from './components/modules/Day';
import ProfileSelector from './components/ProfileSelector';
import { useMonthlySchedule } from './hooks/useSchedulerApi';
import { ScheduledHouseWork } from '@/types/schedule';
import { formatDate } from '@/utils/date';

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: monthlySchedule } = useMonthlySchedule(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // 달력에 표시할 날짜들 계산 (이전 달의 일부 + 현재 달 + 다음 달의 일부)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

  // 달력에 표시할 모든 날짜 생성
  const calendarDays = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 월 전환 함수들
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // 한국어 월 이름
  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  // 요일 이름
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 달력 컨테이너 */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="이전 달"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <h2 className="text-2xl font-semibold text-gray-800">
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h2>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="다음 달"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`p-3 text-center font-medium text-sm ${
                  index === 0
                    ? 'text-red-500'
                    : index === 6
                      ? 'text-blue-500'
                      : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const schedules = monthlySchedule?.data.filter(
                schedule => schedule.date === formatDate(date)
              );

              return (
                <Day
                  key={`${date} ${index}`}
                  date={date}
                  currentDate={currentDate}
                  schedules={schedules as ScheduledHouseWork[]}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center">
          <ProfileSelector />
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            오늘로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
