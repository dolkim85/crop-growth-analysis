@echo off
echo ============================================================
echo 🚀 스마트팜 하이브리드 AI 백엔드 서버 시작
echo ============================================================
echo.

cd /d "%~dp0"

echo 📂 현재 디렉토리: %CD%
echo.

:: 가상환경 확인 및 생성
if not exist "venv" (
    echo 🔧 Python 가상환경 생성 중...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 가상환경 생성 실패. Python이 설치되어 있는지 확인해주세요.
        pause
        exit /b 1
    )
    echo ✅ 가상환경 생성 완료
    echo.
)

:: 가상환경 활성화
echo 🔄 가상환경 활성화...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 가상환경 활성화 실패
    pause
    exit /b 1
)

:: 의존성 설치
echo 📦 Python 패키지 설치 중...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ 패키지 설치 실패
    echo 💡 requirements.txt 파일이 있는지 확인해주세요.
    pause
    exit /b 1
)

:: 업로드 폴더 생성
if not exist "uploads" (
    echo 📁 업로드 폴더 생성...
    mkdir uploads
)

echo.
echo ============================================================
echo ✅ 환경 설정 완료
echo ============================================================
echo 🌐 하이브리드 모드: 다중 포트 자동 감지
echo 🔧 포트 충돌 시 자동으로 다른 포트 시도
echo ⚡ 클라이언트 사이드 AI 폴백 지원
echo ============================================================
echo.

:: Flask 서버 시작
echo 🚀 AI 백엔드 서버 시작 중...
python run.py

echo.
echo 서버가 종료되었습니다.
pause 