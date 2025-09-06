# MongoDB에서 MySQL로 마이그레이션 가이드

이 문서는 집안일 스케줄러 프로젝트를 MongoDB에서 MySQL로 마이그레이션하는 방법을 설명합니다.

## 마이그레이션 개요

### 변경 사항

- **데이터베이스**: MongoDB → MySQL 8.0
- **ORM**: Mongoose → TypeORM
- **스키마**: MongoDB 스키마 → MySQL 엔티티
- **연결**: MongoDB URI → MySQL 연결 설정

### 이점

- 라즈베리파이와의 호환성 향상
- 더 나은 성능과 안정성
- 표준 SQL 쿼리 사용 가능
- 트랜잭션 지원

## 마이그레이션 단계

### 1. 환경 준비

#### 기존 데이터 백업

```bash
# MongoDB 데이터 백업
docker exec house-work-mongodb mongodump --out /backup
docker cp house-work-mongodb:/backup ./mongo-backup
```

#### 새로운 환경 변수 설정

```env
# 기존 MongoDB 설정 제거
# MONGODB_URI=mongodb://admin:password123@mongodb:27017/house-work-scheduler?authSource=admin

# 새로운 MySQL 설정 추가
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USERNAME=housework
MYSQL_PASSWORD=housework123
MYSQL_DATABASE=house_work_scheduler
```

### 2. 코드 변경사항

#### 패키지 의존성 변경

```json
{
  "dependencies": {
    // 제거
    "@nestjs/mongoose": "^11.0.3",
    "mongoose": "^8.18.0",

    // 추가
    "@nestjs/typeorm": "^10.0.2",
    "mysql2": "^3.9.2",
    "typeorm": "^0.3.21"
  }
}
```

#### 스키마 → 엔티티 변환

```typescript
// 기존 MongoDB 스키마
@Schema({ timestamps: true })
export class HouseWorkHistory {
  @Prop({ required: true })
  id: string;
  // ...
}

// 새로운 MySQL 엔티티
@Entity('housework_history')
export class HouseWorkHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  houseWorkId: string;
  // ...
}
```

#### 서비스 코드 변경

```typescript
// 기존 MongoDB
@InjectModel(HouseWorkHistory.name)
private readonly houseWorkHistoryModel: Model<HouseWorkHistoryDocument>,

// 새로운 MySQL
@InjectRepository(HouseWorkHistory)
private readonly houseWorkHistoryRepository: Repository<HouseWorkHistory>,
```

### 3. 데이터 마이그레이션

#### 마이그레이션 스크립트 실행

```bash
# 백엔드 디렉토리로 이동
cd packages/backend

# 마이그레이션 스크립트 실행
npm run migrate:mongo-to-mysql
```

#### 마이그레이션 스크립트 동작

1. MongoDB에서 기존 데이터 조회
2. MySQL 연결 설정
3. 데이터 변환 및 중복 확인
4. MySQL에 데이터 삽입
5. 마이그레이션 결과 리포트

### 4. Docker 설정 변경

#### docker-compose.yml 변경

```yaml
services:
  # MongoDB → MySQL 변경
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password123
      MYSQL_DATABASE: house_work_scheduler
      MYSQL_USER: housework
      MYSQL_PASSWORD: housework123
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql-init:/docker-entrypoint-initdb.d
```

#### 초기화 스크립트

- `mongo-init/` → `mysql-init/` 디렉토리 변경
- MongoDB 초기화 스크립트 → MySQL 초기화 스크립트

### 5. 배포 및 테스트

#### 서비스 재시작

```bash
# 기존 서비스 중지
docker compose down

# 새로운 설정으로 빌드 및 시작
docker compose build --no-cache
docker compose up -d
```

#### 기능 테스트

```bash
# 헬스 체크
curl http://localhost:3001/health

# 스케줄러 상태 확인
curl http://localhost:3001/scheduler/status

# 월별 스케줄 조회
curl http://localhost:3001/scheduler/monthly/2025/8
```

## 문제 해결

### 일반적인 문제들

#### 1. 의존성 충돌

```bash
# TypeORM 버전 호환성 문제 해결
npm install --force
```

#### 2. 데이터베이스 연결 실패

```bash
# MySQL 서비스 상태 확인
docker compose logs mysql

# 연결 재시도 (TypeORM이 자동으로 처리)
```

#### 3. 데이터 마이그레이션 실패

```bash
# 환경 변수 확인
echo $MYSQL_HOST
echo $MYSQL_USERNAME

# 수동으로 마이그레이션 스크립트 실행
node dist/scripts/migrate-mongo-to-mysql.js
```

### 로그 확인

```bash
# 백엔드 로그
docker compose logs backend

# MySQL 로그
docker compose logs mysql

# 실시간 로그 모니터링
docker compose logs -f backend
```

## 롤백 계획

### 긴급 롤백

```bash
# 기존 MongoDB 설정으로 복원
git checkout HEAD~1

# MongoDB 서비스 재시작
docker compose down
docker compose up mongodb -d
docker compose up backend -d
```

### 데이터 복원

```bash
# MongoDB 백업에서 복원
docker exec house-work-mongodb mongorestore /backup
```

## 성능 최적화

### MySQL 설정 최적화

```sql
-- 인덱스 추가
CREATE INDEX idx_date_original ON housework_history(date, originalHouseWorkId);

-- 쿼리 최적화
EXPLAIN SELECT * FROM housework_history WHERE date >= '2025-08-01';
```

### TypeORM 설정 최적화

```typescript
TypeOrmModule.forRoot({
  // 연결 풀 설정
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
  // 로깅 설정
  logging: process.env.NODE_ENV === 'development',
});
```

## 결론

MongoDB에서 MySQL로의 마이그레이션이 성공적으로 완료되었습니다.

### 주요 성과

- ✅ 라즈베리파이 호환성 향상
- ✅ 안정적인 데이터베이스 운영
- ✅ 표준 SQL 쿼리 사용 가능
- ✅ 트랜잭션 지원

### 다음 단계

1. 성능 모니터링
2. 백업 전략 수립
3. 추가 최적화 적용

## 참고 자료

- [TypeORM 공식 문서](https://typeorm.io/)
- [MySQL 8.0 문서](https://dev.mysql.com/doc/refman/8.0/en/)
- [NestJS TypeORM 가이드](https://docs.nestjs.com/techniques/database)
