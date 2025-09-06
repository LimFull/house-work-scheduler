'use client';

import {
  useScheduleForDate,
  useUpdateDoneStatus,
} from '@/app/hooks/useSchedulerApi';
import { useParams } from 'next/navigation';
import { useUserProfile } from '@/app/hooks/useUserProfile';

function DetailPage() {
  const { userType } = useUserProfile();
  const { date } = useParams();
  const { data: schedules } = useScheduleForDate(date as string);
  const { mutate: updateDoneStatus } = useUpdateDoneStatus();

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      {schedules?.map(schedule => (
        <div
          className={`p-4 my-4 border-b border-gray-200 flex justify-between ${schedule.assignee === '👦🏻' ? 'bg-blue-100' : 'bg-pink-100'}`}
          key={schedule.id}
        >
          {`${schedule.emoji} ${schedule.title}`}
          <button
            className="ml-4 px-2 py-1 rounded-md text-white cursor-pointer"
            style={{ backgroundColor: schedule.isDone ? 'green' : 'gray' }}
            onClick={() =>
              updateDoneStatus({
                id: schedule.id,
                isDone: !schedule.isDone,
                assignee: userType || undefined,
              })
            }
          >
            {schedule.isDone ? '완료' : '미완료'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default DetailPage;
