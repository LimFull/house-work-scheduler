#!/bin/bash

echo "🔄 House Work Scheduler - Raspberry Pi 업데이트 시작"

# 1. Git에서 최신 코드 가져오기
echo "📥 최신 코드 가져오는 중..."
git pull origin main

# 2. 변경된 파일 확인
echo "🔍 변경된 파일 확인 중..."
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

# 3. 변경된 서비스 확인 및 빌드
if echo "$CHANGED_FILES" | grep -q "packages/frontend"; then
    echo "🎨 프론트엔드 변경 감지 - 빌드 중..."
    docker compose build frontend
    FRONTEND_UPDATED=true
fi

if echo "$CHANGED_FILES" | grep -q "packages/backend"; then
    echo "🔧 백엔드 변경 감지 - 빌드 중..."
    docker compose build backend
    BACKEND_UPDATED=true
fi

if echo "$CHANGED_FILES" | grep -q "docker-compose.yml\|Dockerfile"; then
    echo "🐳 Docker 설정 변경 감지 - 전체 빌드 중..."
    docker compose build --no-cache
    FRONTEND_UPDATED=true
    BACKEND_UPDATED=true
fi

# 4. 변경사항이 없으면 전체 빌드
if [ -z "$FRONTEND_UPDATED" ] && [ -z "$BACKEND_UPDATED" ]; then
    echo "📦 변경사항 없음 - 전체 빌드 중..."
    docker compose build
fi

# 5. 서비스 재시작
echo "🚀 서비스 재시작 중..."
docker compose up -d

# 6. 서비스 상태 확인
echo "⏳ 서비스 시작 대기 중..."
sleep 30

echo "🔍 서비스 상태 확인 중..."
if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ 프론트엔드 (포트 3002): 정상 실행"
else
    echo "❌ 프론트엔드 (포트 3002): 실행 실패"
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

echo "🎉 업데이트 완료!"
echo "📱 프론트엔드: http://localhost:3002"
echo "🔧 백엔드 API: http://localhost:3001"
echo "📊 로그 확인: docker compose logs -f"
