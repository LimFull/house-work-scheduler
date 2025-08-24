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
}

interface Props {
  date: Date;
  currentDate: Date;
  schedules?: ScheduledHouseWork[];
}

export default function Day({ date, currentDate, schedules }: Props) {
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (schedules && schedules.length > 0) {
    console.log({ date, getDate: date.getDate() });
    console.log(schedules);
  }

  return (
    <div
      className={`
        p-3 min-h-[80px] border border-gray-200 rounded-lg cursor-pointer
        transition-colors hover:bg-gray-50
        ${!isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
        ${date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : 'text-gray-800'}
      `}
    >
      <div className="text-sm font-medium mb-1">
        {date.getDate()}
      </div>
      <div className="text-xs text-gray-500">
        {schedules?.map((schedule: ScheduledHouseWork) => (
          <div key={schedule.id}>
            {schedule.title}
          </div>
        ))}
      </div>
    </div>
  );
}