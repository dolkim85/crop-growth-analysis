@echo off
chcp 65001 >nul
title 스마트팜 작물 성장 분석 시스템 V11.4 배포

echo ================================================
echo 🌱 스마트팜 작물 성장 분석 시스템 V11.4
echo    Federated Learning Integration
echo ================================================
echo.

echo 🚀 프로덕션 환경 배포 시작...
echo ============================================

REM 환경 체크
echo 📋 환경 체크 중...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker가 설치되지 않았습니다.
    echo    https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose가 설치되지 않았습니다.
    pause
    exit /b 1
)

echo ✅ 환경 체크 완료
echo.

REM 환경 변수 파일 생성
if not exist .env.production (
    echo ⚠️ .env.production 파일을 생성합니다...
    (
        echo # 프로덕션 환경 설정
        echo NODE_ENV=production
        echo FLASK_ENV=production
        echo SECRET_KEY=your-super-secret-production-key-change-this
        echo NEXT_PUBLIC_API_URL=http://localhost:5000
        echo NEXT_PUBLIC_APP_VERSION=V11.4
        echo.
        echo # 보안 설정
        echo ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
        echo CORS_ENABLED=true
        echo RATE_LIMIT_ENABLED=true
        echo.
        echo # AI 설정
        echo AI_MODEL_VERSION=v2.0
        echo AI_ACCURACY_THRESHOLD=0.85
        echo MAX_UPLOAD_SIZE=16777216
        echo.
        echo # 성능 설정
        echo WORKERS=4
        echo TIMEOUT=300
        echo KEEPALIVE=2
    ) > .env.production
)

REM 필수 디렉토리 생성
echo 📁 필수 디렉토리 생성 중...
if not exist backend\uploads mkdir backend\uploads
if not exist backend\models mkdir backend\models
if not exist backend\logs mkdir backend\logs
if not exist ssl mkdir ssl
if not exist monitoring mkdir monitoring
if not exist monitoring\grafana mkdir monitoring\grafana

REM 백업 생성
echo 💾 현재 데이터 백업 중...
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set backup_dir=backups\%timestamp%
if not exist backups mkdir backups
mkdir "%backup_dir%"

if exist backend\uploads xcopy backend\uploads "%backup_dir%\uploads\" /E /I /Q >nul
if exist backend\models xcopy backend\models "%backup_dir%\models\" /E /I /Q >nul
if exist backend\logs xcopy backend\logs "%backup_dir%\logs\" /E /I /Q >nul

echo ✅ 백업 완료: %backup_dir%

REM Docker 이미지 빌드
echo 🐳 Docker 이미지 빌드 중...
docker-compose -f docker-compose.yml build --no-cache
if errorlevel 1 (
    echo ❌ Docker 빌드 실패
    pause
    exit /b 1
)

REM 기존 컨테이너 정리
echo 🧹 기존 컨테이너 정리 중...
docker-compose down --remove-orphans >nul 2>&1

REM 서비스 시작
echo 🎯 서비스 시작 중...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 서비스 시작 실패
    pause
    exit /b 1
)

REM 서비스 상태 확인
echo ⏳ 서비스 상태 확인 중...
timeout /t 10 /nobreak >nul

REM 헬스체크
echo 🔍 백엔드 서비스 확인 중...
for /l %%i in (1,1,30) do (
    curl -f http://localhost:5000/api/v1/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 백엔드 서비스 정상 작동
        goto :frontend_check
    )
    echo ⏳ 백엔드 서비스 시작 대기 중... (%%i/30)
    timeout /t 2 /nobreak >nul
)
echo ❌ 백엔드 서비스 시작 실패
docker-compose logs backend
goto :end

:frontend_check
echo 🔍 프론트엔드 서비스 확인 중...
for /l %%i in (1,1,30) do (
    curl -f http://localhost:3000 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 프론트엔드 서비스 정상 작동
        goto :nginx_check
    )
    echo ⏳ 프론트엔드 서비스 시작 대기 중... (%%i/30)
    timeout /t 2 /nobreak >nul
)
echo ❌ 프론트엔드 서비스 시작 실패
docker-compose logs frontend
goto :end

:nginx_check
echo 🔍 Nginx 서비스 확인 중...
for /l %%i in (1,1,10) do (
    curl -f http://localhost/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Nginx 서비스 정상 작동
        goto :success
    )
    echo ⏳ Nginx 서비스 시작 대기 중... (%%i/10)
    timeout /t 2 /nobreak >nul
)
echo ⚠️ Nginx 서비스 확인 실패 (선택사항)

:success
echo.
echo 🎉 배포 완료!
echo ============================================
echo 📊 서비스 접속 정보:
echo    • 프론트엔드: http://localhost:3000
echo    • 백엔드 API: http://localhost:5000
echo    • Nginx 프록시: http://localhost:80
echo    • HTTPS (개발용): https://localhost:443
echo.
echo 🔧 관리 명령어:
echo    • 로그 확인: docker-compose logs -f [service]
echo    • 서비스 중지: docker-compose down
echo    • 서비스 재시작: docker-compose restart
echo    • 컨테이너 상태: docker-compose ps
echo.
echo 📋 API 테스트:
echo    curl http://localhost:5000/api/v1/health
echo    curl http://localhost:5000/api/v1/models
echo.
echo 🚀 스마트팜 V11.4 연합학습 시스템이 성공적으로 배포되었습니다!
echo ============================================

:end
pause 