#!/usr/bin/env python3
"""
Railway 배포 전용 시작 스크립트
간소화된 Flask 서버 실행
"""

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# 간단한 Flask 앱 생성
app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def root():
    """Railway 헬스체크를 위한 루트 경로"""
    return jsonify({
        "status": "success",
        "message": "dolkim85 스마트팜 백엔드 서버가 실행 중입니다.",
        "version": "1.3.0-railway-ready"
    })

@app.route('/health', methods=['GET'])
def health():
    """간단한 헬스체크"""
    return jsonify({"status": "success"})

@app.route('/api/v1/health', methods=['GET'])
def health_v1():
    """API v1 헬스체크"""
    return jsonify({
        "status": "success",
        "message": "AI 백엔드 서버가 정상적으로 실행 중입니다.",
        "version": "1.3.0-railway-ready"
    })

if __name__ == "__main__":
    # Railway PORT 환경변수 사용 (동적 포트 할당)
    port = int(os.environ.get("PORT", 5000))
    
    print(f"🚀 Railway 배포 모드 시작 - 포트: {port}")
    print(f"🌐 서버 주소: 0.0.0.0:{port}")
    print("📝 Railway 환경변수 PORT 사용")
    
    # Flask 서버 시작
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    ) 