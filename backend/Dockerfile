# Backend Dockerfile for Flask with Gunicorn - Optimized
FROM python:3.11-slim

# 시스템 업데이트 및 필수 패키지 설치 (최적화)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libgl1-mesa-glx \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Python 의존성을 먼저 복사하고 설치 (캐시 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# 애플리케이션 코드 복사
COPY . .

# 필수 디렉토리 생성 및 권한 설정
RUN mkdir -p uploads logs models \
    && touch logs/access.log logs/error.log logs/app.log \
    && chmod 755 uploads logs models

# 환경변수 설정
ENV FLASK_ENV=production \
    PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    WORKERS=4 \
    TIMEOUT=300 \
    KEEPALIVE=2

# 포트 노출 (Railway 동적 포트 사용)
EXPOSE $PORT

# 헬스체크 제거 (Railway 자체 헬스체크 사용)
# HEALTHCHECK는 Railway에서 자체적으로 처리

# Gunicorn으로 애플리케이션 실행
CMD ["gunicorn", "--config", "gunicorn.conf.py", "run:app"] 