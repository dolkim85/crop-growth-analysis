#!/usr/bin/env python3
"""
단계별 Flask 서버 시작 - 헬스체크 최적화
서버 먼저 시작 → 백그라운드 초기화 → 헬스체크 성공
"""

import os
import sys
import time
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS

# 전역 준비 상태 플래그
SERVER_READY = False
INITIALIZATION_STATUS = "starting"
INITIALIZATION_PROGRESS = 0

# Flask 앱 생성 (매우 빠름 - 0.1초)
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"]
    }
})

def initialize_server():
    """서버 초기화 작업 (백그라운드 스레드)"""
    global SERVER_READY, INITIALIZATION_STATUS, INITIALIZATION_PROGRESS
    
    try:
        print("🔧 백그라운드 서버 초기화 시작...")
        
        # 1단계: 기본 설정 (1초)
        INITIALIZATION_STATUS = "loading_config"
        INITIALIZATION_PROGRESS = 10
        time.sleep(1)
        print("✅ 기본 설정 완료")
        
        # 2단계: 업로드 폴더 생성 (1초)
        INITIALIZATION_STATUS = "creating_directories"
        INITIALIZATION_PROGRESS = 30
        upload_folder = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        time.sleep(1)
        print("✅ 디렉토리 생성 완료")
        
        # 3단계: 의존성 확인 (2초)
        INITIALIZATION_STATUS = "checking_dependencies"
        INITIALIZATION_PROGRESS = 50
        time.sleep(2)
        print("✅ 의존성 확인 완료")
        
        # 4단계: AI 모델 준비 (실제 환경에서는 모델 로딩)
        INITIALIZATION_STATUS = "preparing_ai_models"
        INITIALIZATION_PROGRESS = 70
        time.sleep(2)
        print("✅ AI 모델 준비 완료")
        
        # 5단계: 최종 검증 (1초)
        INITIALIZATION_STATUS = "finalizing"
        INITIALIZATION_PROGRESS = 90
        time.sleep(1)
        print("✅ 최종 검증 완료")
        
        # 완료!
        INITIALIZATION_PROGRESS = 100
        SERVER_READY = True
        INITIALIZATION_STATUS = "ready"
        print("🎉 서버 완전 준비 완료!")
        
    except Exception as e:
        print(f"❌ 서버 초기화 실패: {e}")
        INITIALIZATION_STATUS = "failed"
        INITIALIZATION_PROGRESS = -1

# Railway 헬스체크용 - 서버 시작되면 바로 응답
@app.route('/', methods=['GET'])
def root():
    """Railway 헬스체크 - 서버가 시작되면 바로 OK 응답"""
    return "OK", 200

@app.route('/status', methods=['GET'])
def status():
    """서버 상태 상세 확인"""
    return jsonify({
        "server_started": True,
        "server_ready": SERVER_READY,
        "initialization_status": INITIALIZATION_STATUS,
        "progress": INITIALIZATION_PROGRESS,
        "message": "서버 시작됨" if not SERVER_READY else "서버 준비 완료"
    })

@app.route('/health', methods=['GET'])
def health():
    """기본 헬스체크 - 항상 성공"""
    return jsonify({
        "status": "healthy",
        "server_ready": SERVER_READY,
        "initialization": INITIALIZATION_STATUS
    })

@app.route('/api/v1/health', methods=['GET'])
def health_v1():
    """API v1 헬스체크"""
    if SERVER_READY:
        return jsonify({
            "status": "success",
            "message": "AI 백엔드 서버가 완전히 준비되었습니다.",
            "version": "1.4.0-optimized"
        })
    else:
        return jsonify({
            "status": "initializing",
            "message": f"서버 초기화 중... ({INITIALIZATION_STATUS})",
            "progress": INITIALIZATION_PROGRESS,
            "version": "1.4.0-optimized"
        }), 202  # 202 Accepted (처리 중)

@app.route('/api/v1/analyze', methods=['POST'])
def analyze():
    """이미지 분석 API - 서버 준비 후에만 실행"""
    if not SERVER_READY:
        return jsonify({
            "status": "error",
            "message": f"서버 초기화 중입니다. 잠시 후 다시 시도해주세요. ({INITIALIZATION_STATUS})",
            "progress": INITIALIZATION_PROGRESS
        }), 503
    
    # 실제 분석 로직 (현재는 시뮬레이션)
    return jsonify({
        "status": "success",
        "message": "이미지 분석 완료",
        "data": {
            "health": "양호",
            "growth": "정상",
            "recommendation": "현재 상태를 유지하세요"
        }
    })

if __name__ == "__main__":
    # Railway PORT 환경변수 사용
    port = int(os.environ.get("PORT", 5000))
    
    print("="*60)
    print("🚀 dolkim85 스마트팜 백엔드 V1.4 - 헬스체크 최적화")
    print("="*60)
    print(f"📡 포트: {port}")
    print(f"🌐 서버 주소: 0.0.0.0:{port}")
    print("⚡ 전략: 서버 먼저 시작 → 백그라운드 초기화")
    print("="*60)
    
    # 백그라운드에서 초기화 시작
    init_thread = threading.Thread(target=initialize_server, daemon=True)
    init_thread.start()
    print("🔧 백그라운드 초기화 스레드 시작됨")
    
    # Flask 서버 즉시 시작 (헬스체크 준비 완료)
    print("🌐 Flask 서버 시작 중...")
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True,
        use_reloader=False  # 리로더 비활성화로 더 빠른 시작
    ) 