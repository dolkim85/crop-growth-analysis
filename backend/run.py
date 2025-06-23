from flask import Flask
from flask_cors import CORS
from app.routes.analyze import analyze_bp
from dotenv import load_dotenv
import os
import socket

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = os.getenv("UPLOAD_FOLDER", "./uploads")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "default-secret-key")

# 블루프린트 등록
app.register_blueprint(analyze_bp)

def find_available_port(start_port=5000, max_attempts=10):
    """사용 가능한 포트를 찾는 함수"""
    ports_to_try = [5000, 5001, 5002, 8000, 8080, 3001]
    
    for port in ports_to_try:
        try:
            # 포트가 사용 가능한지 확인
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result != 0:  # 포트가 사용 중이 아님
                return port
        except Exception:
            continue
    
    # 모든 지정된 포트가 사용 중이면 동적으로 포트 찾기
    for port in range(start_port, start_port + max_attempts):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result != 0:
                return port
        except Exception:
            continue
    
    return None

@app.route('/api/v1/models', methods=['GET'])
def get_models():
    """사용 가능한 AI 모델 목록 반환"""
    models = [
        {
            "id": "advanced-plant-ai-v2",
            "name": "고급 식물 분석 AI v2.0 (서버)",
            "category": "무료",
            "accuracy": "94%",
            "description": "OpenCV와 머신러닝을 활용한 고정밀 식물 분석 모델입니다.",
            "provider": "Smart Farm AI Server",
            "features": ["색상 분석", "형태 분석", "질병 감지", "환경 최적화"],
            "analysisItems": [
                {"id": "plantHealth", "name": "식물 건강도", "type": "number", "unit": "%"},
                {"id": "leafColor", "name": "잎 색상 분석", "type": "object", "unit": ""},
                {"id": "size", "name": "크기 추정", "type": "number", "unit": "cm"},
                {"id": "leafCount", "name": "잎 개수", "type": "number", "unit": "개"},
                {"id": "diseaseDetection", "name": "질병 감지", "type": "object", "unit": ""},
                {"id": "maturityLevel", "name": "성숙도", "type": "number", "unit": "%"},
                {"id": "growthRate", "name": "성장률", "type": "number", "unit": "점"}
            ]
        },
        {
            "id": "tensorflow-plant-server",
            "name": "TensorFlow 식물 분석 모델 (서버)",
            "category": "학습AI",
            "accuracy": "97%",
            "description": "딥러닝 기반 실시간 학습 가능한 식물 분석 모델입니다.",
            "provider": "Smart Farm AI Server",
            "features": ["딥러닝 분석", "실시간 학습", "정밀 진단", "예측 분석"],
            "analysisItems": [
                {"id": "plantHealth", "name": "식물 건강도", "type": "number", "unit": "%"},
                {"id": "diseaseDetection", "name": "질병/해충 감지", "type": "object", "unit": ""},
                {"id": "growthStage", "name": "성장 단계", "type": "string", "unit": ""},
                {"id": "maturityLevel", "name": "성숙도 평가", "type": "number", "unit": "%"},
                {"id": "environmentScore", "name": "환경 적합도", "type": "number", "unit": "점"},
                {"id": "predictedYield", "name": "예상 수확량", "type": "number", "unit": "kg"}
            ]
        }
    ]
    
    return {
        "status": "success",
        "data": models,
        "message": f"AI 모델 목록을 성공적으로 로드했습니다."
    }

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return {
        "status": "success",
        "message": "AI 백엔드 서버가 정상적으로 실행 중입니다.",
        "version": "1.1.0-hybrid"
    }

if __name__ == "__main__":
    # 사용 가능한 포트 찾기
    port = find_available_port()
    
    if port is None:
        print("❌ 사용 가능한 포트를 찾을 수 없습니다.")
        exit(1)
    
    print("\n" + "="*60)
    print("🚀 스마트팜 AI 백엔드 서버 시작")
    print("="*60)
    print(f"📡 포트: {port}")
    print(f"🌐 URL: http://localhost:{port}")
    print(f"🔗 API: http://localhost:{port}/api/v1/")
    print(f"💾 업로드 폴더: {app.config['UPLOAD_FOLDER']}")
    print("="*60)
    print("📝 사용 가능한 엔드포인트:")
    print(f"   • GET  /api/v1/health   - 서버 상태 확인")
    print(f"   • GET  /api/v1/models   - AI 모델 목록")
    print(f"   • POST /api/v1/analyze  - 식물 이미지 분석")
    print("="*60)
    print("🔧 하이브리드 모드: 프론트엔드에서 다중 포트 자동 감지")
    print("⚡ 연결 실패 시 클라이언트 사이드 AI로 자동 폴백")
    print("="*60)
    
    try:
        app.run(debug=True, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")
        print("💡 다른 포트를 시도하거나 실행 중인 서버를 종료해주세요.") 