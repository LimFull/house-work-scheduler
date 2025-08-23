#!/bin/bash

echo "🚀 라즈베리파이에 nvm 및 Node.js 설치 시작"

# 1. 시스템 업데이트
echo "📦 시스템 패키지 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# 2. 필요한 패키지 설치
echo "🔧 필요한 패키지 설치 중..."
sudo apt install -y curl wget git build-essential

# 3. nvm 설치
echo "📥 nvm 설치 중..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 4. 환경 변수 설정
echo "⚙️ 환경 변수 설정 중..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 5. .bashrc에 nvm 설정 추가
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc

# 6. Node.js 20.18.1 설치
echo "📦 Node.js 20.18.1 설치 중..."
nvm install 20.18.1

# 7. 기본 버전으로 설정
echo "🔧 Node.js 20.18.1을 기본 버전으로 설정 중..."
nvm use 20.18.1
nvm alias default 20.18.1

# 8. 설치 확인
echo "✅ 설치 확인 중..."
echo "Node.js 버전: $(node --version)"
echo "npm 버전: $(npm --version)"
echo "nvm 버전: $(nvm --version)"

# 9. 설치된 버전들 확인
echo "📋 설치된 Node.js 버전들:"
nvm list

echo "🎉 설치 완료!"
echo "💡 새 터미널을 열거나 'source ~/.bashrc'를 실행하세요."
echo "🔧 현재 Node.js 버전: $(node --version)"
