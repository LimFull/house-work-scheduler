# House Work Scheduler

집안일 스케줄러 모노레포 프로젝트입니다. Next.js 프론트엔드와 Nest.js 백엔드로 구성되어 있으며, MongoDB를 데이터베이스로 사용합니다.

## 프로젝트 구조

```
house-work-scheduler/
├── packages/
│   ├── frontend/     # Next.js 프론트엔드 (포트: 3000)
│   └── backend/      # Nest.js 백엔드 (포트: 3001)
├── mongo-init/       # MongoDB 초기화 스크립트
├── docker-compose.yml
└── package.json
```

## 기술 스택

### Frontend
- Next.js 15.5.0
- TypeScript
- Tailwind CSS
- React 19.1.0

### Backend
- Nest.js 11.0.1
- TypeScript
- MongoDB (Mongoose)
- Express

### Infrastructure
- Docker & Docker Compose
- MongoDB 7.0

## 개발 환경 설정

### 1. 의존성 설치

```bash
# 루트 레벨에서 모든 패키지 설치
npm install

# 또는 각 패키지별로 설치
npm install --workspace=frontend
npm install --workspace=backend
```

### 2. 개발 서버 실행

```bash
# 프론트엔드와 백엔드 동시 실행
npm run dev

# 개별 실행
npm run dev:frontend  # 프론트엔드만 (포트: 3000)
npm run dev:backend   # 백엔드만 (포트: 3001)
```

### 3. 빌드

```bash
# 모든 패키지 빌드
npm run build

# 개별 빌드
npm run build:frontend
npm run build:backend
```

## Docker 환경

### 1. Docker Compose로 전체 서비스 실행

```bash
# 서비스 빌드 및 실행
npm run docker:build
npm run docker:up

# 또는 직접 실행
docker-compose up -d

# 로그 확인
npm run docker:logs
```

### 2. 개별 서비스 실행

```bash
# MongoDB만 실행
docker-compose up mongodb -d

# 백엔드만 실행
docker-compose up backend -d

# 프론트엔드만 실행
docker-compose up frontend -d
```

### 3. 서비스 중지

```bash
npm run docker:down
# 또는
docker-compose down
```

## 환경 변수

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/house-work-scheduler
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API 엔드포인트

### Health Check
- `GET /health` - 서비스 상태 확인

### 기본 엔드포인트
- `GET /` - 기본 메시지

## 라즈베리파이 배포

이 프로젝트는 라즈베리파이에서 실행할 수 있도록 Docker로 구성되어 있습니다.

### 1. 라즈베리파이에 Docker 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get install docker-compose-plugin
```

### 2. 프로젝트 배포

```bash
# 프로젝트 클론
git clone <repository-url>
cd house-work-scheduler

# Docker Compose로 실행
docker-compose up -d
```

### 3. 자동 재시작 설정

```bash
# 시스템 부팅 시 자동 시작
sudo systemctl enable docker
```

## 개발 가이드

### 새로운 기능 추가

1. **백엔드 API 추가**
   - `packages/backend/src/` 디렉토리에 새로운 모듈 생성
   - MongoDB 스키마 정의
   - 컨트롤러 및 서비스 구현

2. **프론트엔드 페이지 추가**
   - `packages/frontend/src/app/` 디렉토리에 새로운 페이지 생성
   - API 연동 구현

### 데이터베이스 관리

- MongoDB는 `mongo-init/` 디렉토리의 스크립트로 초기화됩니다
- 데이터는 Docker 볼륨 `mongodb_data`에 저장됩니다

## 라이센스

MIT License
# house-work-scheduler
