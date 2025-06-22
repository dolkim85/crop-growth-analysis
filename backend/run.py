from flask import Flask
from flask_cors import CORS
from app.routes.analyze import analyze_bp
from app.config import Config
import os

def create_app():
    """Flask 애플리케이션 팩토리"""
    app = Flask(__name__)
    
    # 설정 로드
    app.config.from_object(Config)
    
    # CORS 설정 (프론트엔드 연결용)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # 업로드 폴더 생성
    upload_folder = app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    # 블루프린트 등록
    app.register_blueprint(analyze_bp)
    
    # 루트 엔드포인트
    @app.route('/')
    def index():
        return {
            "message": "🌱 스마트팜 AI 분석 서버",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "analyze": "/api/v1/analyze",
                "models": "/api/v1/models", 
                "health": "/api/v1/health"
            }
        }
    
    # 에러 핸들러
    @app.errorhandler(404)
    def not_found(error):
        return {
            "status": "error",
            "message": "엔드포인트를 찾을 수 없습니다.",
            "available_endpoints": ["/api/v1/analyze", "/api/v1/models", "/api/v1/health"]
        }, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {
            "status": "error",
            "message": "서버 내부 오류가 발생했습니다."
        }, 500
    
    return app

if __name__ == "__main__":
    app = create_app()
    
    # 환경 변수에서 포트 설정 (기본값: 5000)
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    print(f"🚀 스마트팜 AI 백엔드 서버 시작 중...")
    print(f"📡 서버 주소: http://{host}:{port}")
    print(f"🔧 디버그 모드: {debug}")
    print(f"📁 업로드 폴더: {os.getenv('UPLOAD_FOLDER', './uploads')}")
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True  # 멀티스레딩 지원
    ) 