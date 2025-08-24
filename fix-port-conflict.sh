#!/bin/bash

echo "🔧 포트 충돌 문제 해결 중..."

# 1. 현재 실행 중인 컨테이너 확인
echo "📋 현재 실행 중인 컨테이너:"
docker ps -a

# 2. 포트 27017 사용 확인
echo "🔍 포트 27017 사용 현황:"
sudo netstat -tlnp | grep 27017 || echo "포트 27017 사용 중인 프로세스 없음"

# 3. 기존 서비스 중지
echo "🛑 기존 서비스 중지 중..."
docker compose down

# 4. 모든 컨테이너 중지 (필요시)
echo "🧹 모든 컨테이너 정리 중..."
docker stop $(docker ps -aq) 2>/dev/null || echo "중지할 컨테이너 없음"
docker rm $(docker ps -aq) 2>/dev/null || echo "제거할 컨테이너 없음"

# 5. Docker 시스템 정리
echo "🗑️ Docker 시스템 정리 중..."
docker system prune -f

# 6. 네트워크 정리
echo "🌐 네트워크 정리 중..."
docker network prune -f

# 7. 서비스 재시작
echo "🚀 서비스 재시작 중..."
docker compose up -d

# 8. 상태 확인
echo "⏳ 서비스 시작 대기 중..."
sleep 10

echo "🔍 서비스 상태 확인 중..."
docker compose ps

echo "✅ 포트 충돌 해결 완료!"
echo "📊 로그 확인: docker compose logs -f"

