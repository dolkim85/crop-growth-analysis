"""
🌱 스마트팜 작물 성장 분석 시스템 V2.0 백엔드
프론트엔드 메뉴 완전 대응 Flask 애플리케이션
"""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

# 환경 변수 로드
load_dotenv()

# 데이터베이스 인스턴스
db = SQLAlchemy()

def create_app(config_name='development'):
    """Flask 애플리케이션 팩토리"""
    app = Flask(__name__)
    
    # 설정 로드
    app.config.from_object(f'app.config.{config_name.title()}Config')
    
    # CORS 설정 - 프론트엔드와 완전 호환
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "https://crop-growth-analysis-guendolkim-6814s-projects.vercel.app",
                "https://*.vercel.app"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "supports_credentials": True
        }
    })
    
    # 데이터베이스 초기화
    db.init_app(app)
    
    # 블루프린트 등록 - 프론트엔드 탭별 대응
    from app.routes.analysis import analysis_bp
    from app.routes.environment import environment_bp
    from app.routes.image_analysis import image_analysis_bp
    from app.routes.federated import federated_bp
    from app.routes.camera import camera_bp
    from app.routes.data_management import data_management_bp
    from app.routes.settings import settings_bp
    from app.routes.health import health_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(environment_bp)
    app.register_blueprint(image_analysis_bp)
    app.register_blueprint(federated_bp)
    app.register_blueprint(camera_bp)
    app.register_blueprint(data_management_bp)
    app.register_blueprint(settings_bp)
    
    # 데이터베이스 테이블 생성
    with app.app_context():
        db.create_all()
    
    return app 