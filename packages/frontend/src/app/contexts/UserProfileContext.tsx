'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

// 사용자 타입 정의
export type UserType = '👦🏻' | '👧🏻';

// Context 타입 정의
interface UserProfileContextType {
  userType: UserType | null;
  setUserType: (type: UserType) => void;
  isLoading: boolean;
}

// Context 생성
export const UserProfileContext = createContext<
  UserProfileContextType | undefined
>(undefined);

// Provider Props 타입
interface UserProfileProviderProps {
  children: ReactNode;
}

// Provider 컴포넌트
export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const [userType, setUserTypeState] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage에서 사용자 타입 불러오기
  useEffect(() => {
    const savedUserType = localStorage.getItem('userType') as UserType;
    if (savedUserType && (savedUserType === '👦🏻' || savedUserType === '👧🏻')) {
      setUserTypeState(savedUserType);
    }
    setIsLoading(false);
  }, []);

  // 사용자 타입 설정 함수
  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    localStorage.setItem('userType', type);
  };

  const value = {
    userType,
    setUserType,
    isLoading,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
