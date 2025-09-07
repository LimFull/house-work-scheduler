import { ScheduledHouseWork } from '@/types/schedule';

interface Props {
  schedule: ScheduledHouseWork;
}

function ScheduleItem({ schedule }: Props) {
  const assignee = schedule.assignee;
  const isDone = schedule.isDone;

  return (
    <div
      className={`text-sm font-medium mb-1 rounded-md text-center ${assignee === '👦🏻' ? 'bg-blue-100' : assignee === '👧🏻' ? 'bg-pink-100' : 'bg-yellow-100'}`}
    >
      {schedule.emoji} {isDone ? '✅' : ''}
    </div>
  );
}

export default ScheduleItem;
