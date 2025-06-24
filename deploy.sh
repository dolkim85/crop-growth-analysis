#!/bin/bash

# 스마트팜 작물 성장 분석 시스템 V11.4 배포 스크립트
# Federated Learning Integration 버전

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 스마트팜 시스템 V11.4 배포 시작..."
echo "============================================="

# 환경 변수 체크
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local 파일이 없습니다. 기본값으로 생성합니다..."
    cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=스마트팜 작물 성장 분석 시스템
NEXT_PUBLIC_APP_VERSION=V11.4
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_MAX_FILE_SIZE=16777216
NEXT_PUBLIC_SUPPORTED_FORMATS=jpg,jpeg,png,webp
EOL
fi

if [ ! -f backend/.env.production ]; then
    echo "⚠️  backend/.env.production 파일이 없습니다. 기본값으로 생성합니다..."
    cat > backend/.env.production << EOL
FLASK_ENV=production
SECRET_KEY=$(openssl rand -base64 32)
AI_MODEL_PATH=./models/myplantmodel.pt
UPLOAD_FOLDER=./uploads
AI_MODEL_VERSION=v2.0
AI_ACCURACY_THRESHOLD=0.85
MAX_UPLOAD_SIZE=16777216
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log
WORKERS=4
TIMEOUT=300
KEEPALIVE=2
EOL
fi

# Docker 환경 체크
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다. Docker를 먼저 설치해주세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되지 않았습니다. Docker Compose를 먼저 설치해주세요."
    exit 1
fi

# 필수 디렉토리 생성
echo "📁 필수 디렉토리 생성 중..."
mkdir -p backend/uploads
mkdir -p backend/models
mkdir -p backend/logs
mkdir -p ssl

# SSL 인증서 생성 (개발용)
if [ ! -f ssl/cert.pem ]; then
    echo "🔐 개발용 SSL 인증서 생성 중..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=SmartFarm/CN=localhost"
fi

# Docker 이미지 빌드
echo "🐳 Docker 이미지 빌드 중..."
docker-compose build --no-cache

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker-compose down --remove-orphans

# 서비스 시작
echo "🎯 서비스 시작 중..."
docker-compose up -d

# 서비스 상태 확인
echo "⏳ 서비스 상태 확인 중..."
sleep 10

# 백엔드 헬스체크
echo "🔍 백엔드 서비스 확인 중..."
for i in {1..30}; do
    if curl -f http://localhost:5000/api/v1/health > /dev/null 2>&1; then
        echo "✅ 백엔드 서비스 정상 작동"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 백엔드 서비스 시작 실패"
        docker-compose logs backend
        exit 1
    fi
    echo "⏳ 백엔드 서비스 시작 대기 중... ($i/30)"
    sleep 2
done

# 프론트엔드 헬스체크
echo "🔍 프론트엔드 서비스 확인 중..."
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 프론트엔드 서비스 정상 작동"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 프론트엔드 서비스 시작 실패"
        docker-compose logs frontend
        exit 1
    fi
    echo "⏳ 프론트엔드 서비스 시작 대기 중... ($i/30)"
    sleep 2
done

# Nginx 헬스체크
echo "🔍 Nginx 서비스 확인 중..."
for i in {1..10}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Nginx 서비스 정상 작동"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️ Nginx 서비스 확인 실패 (선택사항)"
        docker-compose logs nginx
    fi
    echo "⏳ Nginx 서비스 시작 대기 중... ($i/10)"
    sleep 2
done

echo ""
echo "🎉 배포 완료!"
echo "============================================="
echo "📊 서비스 접속 정보:"
echo "   • 프론트엔드: http://localhost:3000"
echo "   • 백엔드 API: http://localhost:5000"
echo "   • Nginx 프록시: http://localhost:80"
echo "   • HTTPS (개발용): https://localhost:443"
echo ""
echo "🔧 관리 명령어:"
echo "   • 로그 확인: docker-compose logs -f [service]"
echo "   • 서비스 중지: docker-compose down"
echo "   • 서비스 재시작: docker-compose restart"
echo "   • 컨테이너 상태: docker-compose ps"
echo ""
echo "📋 API 테스트:"
echo "   curl http://localhost:5000/api/v1/health"
echo "   curl http://localhost:5000/api/v1/models"
echo ""
echo "🚀 스마트팜 V11.4 연합학습 시스템이 성공적으로 배포되었습니다!"
echo "=============================================" 