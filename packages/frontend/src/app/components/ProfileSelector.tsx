'use client';

import { useUserProfile } from '../hooks/useUserProfile';

export default function ProfileSelector() {
  const { userType, setUserType, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (userType) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm p-4 mb-6 ${userType === '👦🏻' ? 'border-2 border-blue-300' : 'border-2 border-pink-300'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{userType}</span>
            <span className="text-gray-700 font-medium">
              {userType === '👦🏻' ? '남성' : '여성'} 사용자
            </span>
          </div>
          <button
            onClick={() => setUserType(userType === '👦🏻' ? '👧🏻' : '👦🏻')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            변경
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        프로필을 선택해주세요
      </h2>
      <div className="flex gap-4">
        <button
          onClick={() => setUserType('👦🏻')}
          className="flex-1 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="text-4xl mb-2">👦🏻</div>
          <div className="text-sm font-medium text-gray-700">남성</div>
        </button>
        <button
          onClick={() => setUserType('👧🏻')}
          className="flex-1 p-4 border-2 border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors"
        >
          <div className="text-4xl mb-2">👧🏻</div>
          <div className="text-sm font-medium text-gray-700">여성</div>
        </button>
      </div>
    </div>
  );
}
