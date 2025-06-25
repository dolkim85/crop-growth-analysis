"""
🌱 스마트팜 백엔드 V2.0 실행 파일
프론트엔드 메뉴 완전 대응 서버
"""

import os
from app import create_app

# 환경 설정
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

if __name__ == '__main__':
    # 개발 서버 실행
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=True if config_name == 'development' else False
    ) 