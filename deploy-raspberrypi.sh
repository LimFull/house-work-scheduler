#!/bin/bash

echo "🚀 House Work Scheduler - Raspberry Pi 배포 시작"

# 1. 환경 변수 설정
echo "📝 환경 변수 설정 중..."
cat > packages/backend/.env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://admin:password123@mongodb:27017/house-work-scheduler?authSource=admin
FRONTEND_URL=http://localhost:3000
EOF

cat > packages/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# 2. 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker-compose down

# 3. Docker 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker-compose build --no-cache

# 4. 서비스 실행
echo "🚀 서비스 시작 중..."
docker-compose up -d

# 5. 서비스 상태 확인
echo "⏳ 서비스 시작 대기 중..."
sleep 30

echo "🔍 서비스 상태 확인 중..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 프론트엔드 (포트 3000): 정상 실행"
else
    echo "❌ 프론트엔드 (포트 3000): 실행 실패"
fi

if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 백엔드 (포트 3001): 정상 실행"
else
    echo "❌ 백엔드 (포트 3001): 실행 실패"
fi

if docker ps | grep -q mongodb; then
    echo "✅ MongoDB: 정상 실행"
else
    echo "❌ MongoDB: 실행 실패"
fi

echo "🎉 배포 완료!"
echo "📱 프론트엔드: http://localhost:3000"
echo "🔧 백엔드 API: http://localhost:3001"
echo "📊 로그 확인: docker-compose logs -f"
