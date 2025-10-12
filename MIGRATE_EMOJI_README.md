# Emoji 마이그레이션 스크립트

DB에 저장된 과거 집안일 데이터에 emoji를 추가하는 스크립트입니다.

## 사용 방법

### 1. 필수 조건

- Node.js 설치
- MySQL 데이터베이스 실행 중
- `packages/backend/.env` 파일에 환경 변수 설정:
  ```
  NOTION_TOKEN=your_notion_token
  NOTION_DATABASE_ID=your_database_id
  MYSQL_HOST=localhost
  MYSQL_PORT=3306
  MYSQL_USERNAME=root
  MYSQL_PASSWORD=your_password
  MYSQL_DATABASE=housework_scheduler
  ```

### 2. 의존성 설치

```bash
# 루트 디렉토리에서
npm install mysql2 dotenv

# 또는 백엔드 디렉토리의 node_modules 활용 (이미 설치되어 있음)
```

### 3. 스크립트 실행

```bash
# 방법 1: node로 직접 실행
node migrate-emoji.js

# 방법 2: 실행 권한 부여 후 직접 실행
chmod +x migrate-emoji.js
./migrate-emoji.js
```

## 동작 방식

1. **Notion API 호출**: Notion 데이터베이스에서 집안일 규칙과 emoji를 가져옵니다
2. **DB 조회**: MySQL에서 emoji가 비어있는(`NULL` 또는 `''`) 레코드를 찾습니다
3. **매칭 및 업데이트**: `title`을 기준으로 Notion의 emoji와 매칭하여 업데이트합니다
4. **결과 출력**: 업데이트된 레코드 수와 통계를 표시합니다

## 출력 예시

```
🚀 emoji 마이그레이션 시작

📖 Notion에서 집안일 규칙을 가져오는 중...
✅ 5개의 규칙을 가져왔습니다.

📋 Emoji 매핑:
  🧹 설거지
  🚽 화장실 청소
  🧺 빨래
  🛏️ 침대 정리
  🗑️ 쓰레기 버리기

🔌 MySQL 데이터베이스에 연결 중...
✅ 데이터베이스 연결 성공

📊 업데이트 대상: 15개 레코드

✅ 업데이트 완료!

📊 총 15개 레코드 업데이트됨:

  🧹 설거지: 8개
  🚽 화장실 청소: 4개
  🧺 빨래: 3개

🎉 마이그레이션 성공!

🔌 데이터베이스 연결 종료
```

## 주의사항

- **한 번만 실행**: 이미 emoji가 있는 레코드는 업데이트하지 않습니다
- **백업 권장**: 중요한 데이터인 경우 실행 전 DB 백업을 권장합니다
- **Notion에 없는 항목**: 일회성 집안일 등 Notion에 없는 항목은 업데이트되지 않습니다

## 문제 해결

### 환경 변수 오류
```
❌ 환경 변수가 설정되지 않았습니다!
```
→ `packages/backend/.env` 파일을 확인하세요

### DB 연결 실패
```
❌ 마이그레이션 실패: connect ECONNREFUSED
```
→ MySQL이 실행 중인지 확인하세요: `docker compose up mysql -d`

### Notion API 오류
```
❌ Notion API 오류: 401 Unauthorized
```
→ `NOTION_TOKEN`이 올바른지 확인하세요

## 이후 작업

마이그레이션 후에는:
1. 백엔드 재시작 (변경사항 반영)
2. 프론트엔드 새로고침
3. 달력에서 과거 날짜를 클릭하여 emoji가 표시되는지 확인
