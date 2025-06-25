"""
🌱 스마트팜 백엔드 V2.0 WSGI 실행 파일
프로덕션 배포용
"""

import os
from app import create_app

# 프로덕션 환경 설정
app = create_app('production')

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port) 