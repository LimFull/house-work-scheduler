# 기존 집안일 규칙에서 선택하여 추가하기 기능

## 목표
특정 날짜에 집안일을 추가할 때, 백엔드에 정의된 집안일 규칙 목록에서 선택하여 추가할 수 있는 기능 구현

## 현재 상태 분석

### 백엔드 구조
- `HouseWorkRule`: Notion에서 가져온 집안일 규칙
  - `id`, `title`, `days`, `frequency`, `assignee`, `memo`, `url`, `emoji` 포함
- `this.rules`: HouseWorkSchedulerService에서 관리하는 규칙 배열
- 현재 규칙 조회 API 없음 - **새로 추가 필요**

### 프론트엔드 구조
- 현재는 자유 입력 폼만 존재
- 제목, 이모지, 담당자, 메모를 직접 입력
- `useAddSchedule` hook을 사용하여 일회성 집안일 추가

## 구현 계획

### Phase 1: 백엔드 - 규칙 조회 API 추가
**파일**: `packages/backend/src/scheduler/scheduler.controller.ts`

1. 집안일 규칙 목록 조회 엔드포인트 추가
```typescript
@Get('rules')
getRules() {
  return this.schedulerService.getRules();
}
```

**파일**: `packages/backend/src/scheduler/housework-scheduler.service.ts`

2. 규칙 조회 메서드 추가
```typescript
getRules(): HouseWorkRule[] {
  return this.rules;
}
```

### Phase 2: 백엔드 - 규칙 기반 스케줄 추가 API 개선
**파일**: `packages/backend/src/scheduler/housework-scheduler.service.ts`

기존 `addOneTimeSchedule` 메서드를 확장하거나 새로운 메서드 추가:
- 규칙 ID를 받아서 해당 규칙의 정보(제목, 이모지 등)를 자동으로 채워주는 방식

**선택안 1**: 기존 메서드 그대로 사용 (프론트에서 규칙 정보를 전달)
**선택안 2**: 새 메서드 추가
```typescript
addScheduleFromRule(ruleId: string, date: string): ScheduledHouseWork {
  const rule = this.rules.find(r => r.id === ruleId);
  if (!rule) {
    throw new Error('규칙을 찾을 수 없습니다');
  }

  return this.addOneTimeSchedule(
    rule.title,
    rule.assignee,
    date,
    rule.memo,
    rule.emoji
  );
}
```

→ **선택안 1 채택**: 기존 API 재사용으로 단순화

### Phase 3: 프론트엔드 - 규칙 조회 Hook 추가
**파일**: `packages/frontend/src/app/hooks/useSchedulerApi.ts`

```typescript
export const useRules = () => {
  return useQuery({
    queryKey: ['scheduler', 'rules'],
    queryFn: async (): Promise<HouseWorkRule[]> => {
      const response = await fetch(`${API_BASE_URL}/scheduler/rules`);
      if (!response.ok) {
        throw new Error('규칙 조회 실패');
      }
      return response.json();
    },
  });
};

// HouseWorkRule 타입 정의도 추가
interface HouseWorkRule {
  id: string;
  title: string;
  days: string[];
  frequency: string;
  assignee: string;
  memo: string;
  url: string;
  isDone: boolean;
  emoji: string;
}
```

### Phase 4: 프론트엔드 - UI 개선
**파일**: `packages/frontend/src/app/detail/[date]/page.tsx`

1. 상태 추가
```typescript
const [addMode, setAddMode] = useState<'custom' | 'from-rule'>('custom');
const [selectedRuleId, setSelectedRuleId] = useState<string>('');
const { data: rules } = useRules();
```

2. UI 수정
- 추가 모드 선택 탭 추가: "직접 입력" vs "기존 규칙에서 선택"
- "기존 규칙에서 선택" 모드:
  - 규칙 목록을 드롭다운 또는 리스트로 표시
  - 선택 시 제목, 이모지, 담당자, 메모가 자동으로 채워짐
  - 필요시 수정 가능

3. 추가 로직 수정
```typescript
const handleAddFromRule = () => {
  const selectedRule = rules?.find(r => r.id === selectedRuleId);
  if (!selectedRule) {
    alert('집안일을 선택해주세요');
    return;
  }

  addSchedule({
    title: selectedRule.title,
    assignee: selectedRule.assignee,
    date: date as string,
    memo: selectedRule.memo,
    emoji: selectedRule.emoji,
  }, {
    onSuccess: () => {
      setSelectedRuleId('');
      setIsAddingTask(false);
    },
  });
};
```

## UI 설계

### 추가 폼 구조
```
[+ 집안일 추가 버튼]

추가 폼 표시 시:
┌─────────────────────────────────────┐
│ 새 집안일 추가                        │
│                                     │
│ [ 직접 입력 ] [ 기존 규칙에서 선택 ]  │ ← 탭
│                                     │
│ (직접 입력 모드)                     │
│ - 이모지 입력                        │
│ - 제목 입력                          │
│ - 담당자 선택                        │
│ - 메모 입력                          │
│                                     │
│ (기존 규칙에서 선택 모드)             │
│ - 규칙 드롭다운 선택                  │
│   (선택 시 아래 필드 자동 채워짐)      │
│ - 이모지 (자동/수정가능)              │
│ - 제목 (자동/수정가능)                │
│ - 담당자 (자동/수정가능)              │
│ - 메모 (자동/수정가능)                │
│                                     │
│ [ 추가 ] [ 취소 ]                    │
└─────────────────────────────────────┘
```

## 검증 기준

### Phase 1 검증
- [x] `GET /scheduler/rules` 엔드포인트가 규칙 목록을 반환
- [x] 빌드 성공

### Phase 2 검증
- [ ] 생략 (기존 API 재사용)

### Phase 3 검증
- [x] `useRules` hook이 규칙 목록을 가져옴
- [x] 타입 체크 통과

### Phase 4 검증
자동 검증:
- [x] 프론트엔드 빌드 성공
- [x] 타입 체크 통과

수동 검증 (사용자 확인 필요):
- [x] 탭 전환이 정상 작동
- [x] "기존 규칙에서 선택" 모드에서 규칙 선택 시 필드 자동 채워짐
- [x] 자동 채워진 필드 수정 가능
- [x] 추가 버튼 클릭 시 스케줄에 정상 추가
- [x] UI가 즉시 업데이트됨

## 구현 순서
1. Phase 1: 백엔드 규칙 조회 API
2. Phase 3: 프론트엔드 규칙 조회 Hook
3. Phase 4: 프론트엔드 UI 개선
