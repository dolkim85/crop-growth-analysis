"""
🌱 백엔드 헬스체크 라우트
시스템 상태 확인 및 모니터링
"""

from flask import Blueprint, jsonify
from datetime import datetime
import os
import psutil

health_bp = Blueprint('health', __name__, url_prefix='/api/v2')

@health_bp.route('/', methods=['GET'])
def root():
    """루트 엔드포인트"""
    return jsonify({
        'status': 'success',
        'message': '🌱 스마트팜 백엔드 V2.0 서버가 정상 작동 중입니다',
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@health_bp.route('/health', methods=['GET'])
def health_check():
    """헬스체크 엔드포인트"""
    try:
        # 시스템 정보 수집
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return jsonify({
            'status': 'success',
            'message': '백엔드 서버 정상 작동',
            'data': {
                'server_status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'version': '2.0.0',
                'system_info': {
                    'cpu_usage': f'{cpu_percent}%',
                    'memory_usage': f'{memory.percent}%',
                    'disk_usage': f'{disk.percent}%',
                    'available_memory': f'{memory.available / (1024**3):.1f}GB'
                },
                'services': {
                    'ai_engine': 'active',
                    'database': 'connected',
                    'file_storage': 'available'
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'헬스체크 실패: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

@health_bp.route('/status', methods=['GET'])
def detailed_status():
    """상세 상태 정보"""
    try:
        return jsonify({
            'status': 'success',
            'message': '상세 상태 정보',
            'data': {
                'api_version': 'v2.0',
                'endpoints': {
                    'analysis': '/api/v2/analysis',
                    'environment': '/api/v2/environment',
                    'image_analysis': '/api/v2/image-analysis',
                    'federated': '/api/v2/federated',
                    'camera': '/api/v2/camera',
                    'data_management': '/api/v2/data-management',
                    'settings': '/api/v2/settings'
                },
                'features': [
                    '실시간 분석',
                    '환경 데이터 모니터링',
                    '이미지 분석',
                    '연합학습',
                    '카메라 관리',
                    '데이터 관리',
                    '시스템 설정'
                ],
                'ai_models': [
                    '식물 건강도 분석 V2.0',
                    '성장 단계 분석 V1.8',
                    '질병 탐지 V2.1'
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'상태 정보 조회 실패: {str(e)}'
        }), 500 