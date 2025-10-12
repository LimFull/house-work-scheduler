'use client';

import {
  useScheduleForDate,
  useUpdateDoneStatus,
  useDelaySchedule,
  useAddSchedule,
  useDeleteSchedule,
} from '@/app/hooks/useSchedulerApi';
import { useParams } from 'next/navigation';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { useState } from 'react';

function DetailPage() {
  const { userType } = useUserProfile();
  const { date } = useParams();
  const { data: schedules } = useScheduleForDate(date as string);
  const { mutate: updateDoneStatus } = useUpdateDoneStatus();
  const { mutate: delaySchedule } = useDelaySchedule();
  const { mutate: addSchedule } = useAddSchedule();
  const { mutate: deleteSchedule } = useDeleteSchedule();

  // 추가 폼 상태
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEmoji, setNewTaskEmoji] = useState('📝');
  const [newTaskAssignee, setNewTaskAssignee] = useState(userType || '👦🏻');
  const [newTaskMemo, setNewTaskMemo] = useState('');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      alert('집안일 제목을 입력해주세요');
      return;
    }

    addSchedule(
      {
        title: newTaskTitle,
        assignee: newTaskAssignee,
        date: date as string,
        memo: newTaskMemo,
        emoji: newTaskEmoji,
      },
      {
        onSuccess: () => {
          // 폼 초기화
          setNewTaskTitle('');
          setNewTaskEmoji('📝');
          setNewTaskMemo('');
          setIsAddingTask(false);
        },
      }
    );
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('이 집안일을 삭제하시겠습니까?')) {
      deleteSchedule({ id, date: date as string });
    }
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      {/* 추가 버튼 */}
      {!isAddingTask && (
        <button
          onClick={() => setIsAddingTask(true)}
          className="w-full mb-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          + 집안일 추가
        </button>
      )}

      {/* 추가 폼 */}
      {isAddingTask && (
        <div className="mb-4 p-4 bg-white border-2 border-blue-300 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">새 집안일 추가</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이모지
              </label>
              <input
                type="text"
                value={newTaskEmoji}
                onChange={e => setNewTaskEmoji(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="📝"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="집안일 제목"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTaskAssignee('👦🏻')}
                  className={`flex-1 py-2 rounded-md border-2 ${
                    newTaskAssignee === '👦🏻'
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-gray-300'
                  }`}
                >
                  👦🏻
                </button>
                <button
                  onClick={() => setNewTaskAssignee('👧🏻')}
                  className={`flex-1 py-2 rounded-md border-2 ${
                    newTaskAssignee === '👧🏻'
                      ? 'border-pink-500 bg-pink-100'
                      : 'border-gray-300'
                  }`}
                >
                  👧🏻
                </button>
                <button
                  onClick={() => setNewTaskAssignee('👦🏻👧🏻')}
                  className={`flex-1 py-2 rounded-md border-2 ${
                    newTaskAssignee === '👦🏻👧🏻'
                      ? 'border-yellow-500 bg-yellow-100'
                      : 'border-gray-300'
                  }`}
                >
                  👦🏻👧🏻
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                value={newTaskMemo}
                onChange={e => setNewTaskMemo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="메모 (선택사항)"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                  setNewTaskEmoji('📝');
                  setNewTaskMemo('');
                }}
                className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 집안일 목록 */}
      {schedules?.map(schedule => (
        <div
          className={`p-4 my-4 border-b border-gray-200 flex justify-between items-center ${
            schedule.assignee === '👦🏻'
              ? 'bg-blue-100'
              : schedule.assignee === '👧🏻'
                ? 'bg-pink-100'
                : 'bg-yellow-100'
          }`}
          key={schedule.id}
        >
          <div className="flex items-center gap-3 flex-1">
            {`${schedule.emoji} ${schedule.title}`}
            <button
              className="px-2 py-1 rounded-md text-white cursor-pointer text-xs bg-gray-300"
              onClick={() => delaySchedule({ id: schedule.id })}
            >
              미루기
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded-md text-white cursor-pointer"
              style={{ backgroundColor: schedule.isDone ? 'green' : 'gray' }}
              onClick={() =>
                updateDoneStatus({
                  id: schedule.id,
                  isDone: !schedule.isDone,
                  assignee:
                    schedule.assignee === '👦🏻👧🏻'
                      ? '👦🏻👧🏻'
                      : userType || undefined,
                })
              }
            >
              {schedule.isDone ? '완료' : '미완료'}
            </button>

            <button
              className="px-2 py-1 rounded-md text-white cursor-pointer bg-red-500 hover:bg-red-600 transition-colors"
              onClick={() => handleDeleteTask(schedule.id)}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DetailPage;
