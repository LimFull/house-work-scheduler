import { ScheduledHouseWork } from '@/types/schedule';
import ScheduleItem from './ScheduleItem';
import Link from 'next/link';
import { formatDate } from '@/utils/date';

interface Props {
  date: Date;
  currentDate: Date;
  schedules?: ScheduledHouseWork[];
}

export default function Day({ date, currentDate, schedules }: Props) {
  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Link href={`/detail/${formatDate(date)}`}>
      <div
        className={`
          p-1 min-h-[80px] border border-gray-200 rounded-lg cursor-pointer
          transition-colors hover:bg-gray-50
          ${!isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
          ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
          ${date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : 'text-gray-800'}
        `}
      >
        <div className="text-sm font-medium mb-1">{date.getDate()}</div>
        <div className="text-xs text-gray-500">
          {schedules?.map((schedule: ScheduledHouseWork) => {
            return <ScheduleItem key={schedule.id} schedule={schedule} />;
          })}
        </div>
      </div>
    </Link>
  );
}
