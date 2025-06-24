# Gunicorn 프로덕션 설정
import os
import multiprocessing

# 서버 소켓
bind = "0.0.0.0:5000"
backlog = 2048

# 워커 프로세스
workers = int(os.environ.get("WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000
timeout = int(os.environ.get("TIMEOUT", 300))
keepalive = int(os.environ.get("KEEPALIVE", 2))

# 애플리케이션
wsgi_app = "run:app"
preload_app = True

# 보안
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# 로깅
accesslog = os.environ.get("LOG_FILE", "/app/logs/access.log")
errorlog = os.environ.get("LOG_FILE", "/app/logs/error.log")
loglevel = os.environ.get("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 프로세스 이름
proc_name = "smartfarm-backend"

# PID 파일
pidfile = "/tmp/gunicorn.pid"

# 사용자 권한 (Docker에서는 주석 처리)
# user = 1000
# group = 1000

# 임시 디렉토리
tmp_upload_dir = None

# SSL (필요시)
# keyfile = "/app/ssl/key.pem"
# certfile = "/app/ssl/cert.pem"

# 성능 최적화
max_requests = 1000
max_requests_jitter = 50
preload_app = True 