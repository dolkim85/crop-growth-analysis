"""
🌱 카메라 관리 라우트
프론트엔드 '카메라 관리' 탭 완전 대응
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import uuid
from app.models.plant import Camera
from app import db

camera_bp = Blueprint('camera', __name__, url_prefix='/api/v2/camera')

@camera_bp.route('/cameras', methods=['GET'])
def get_cameras():
    """카메라 목록 조회"""
    try:
        cameras = Camera.query.order_by(Camera.created_at.desc()).all()
        
        # 데이터가 없으면 시뮬레이션 데이터 생성
        if not cameras:
            demo_cameras = _generate_demo_cameras()
            return jsonify({
                'status': 'success',
                'message': '시뮬레이션 카메라 목록',
                'data': {
                    'cameras': demo_cameras,
                    'total_count': len(demo_cameras)
                }
            }), 200
        
        camera_list = []
        for camera in cameras:
            camera_list.append(camera.to_dict())
        
        return jsonify({
            'status': 'success',
            'message': '카메라 목록 조회 완료',
            'data': {
                'cameras': camera_list,
                'total_count': len(camera_list)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'카메라 목록 조회 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras', methods=['POST'])
def add_camera():
    """카메라 추가"""
    try:
        data = request.get_json()
        
        # 필수 필드 검증
        if not data.get('name'):
            return jsonify({
                'status': 'error',
                'message': '카메라 이름은 필수입니다'
            }), 400
        
        # 새 카메라 생성
        camera = Camera(
            id=str(uuid.uuid4()),
            name=data['name'],
            location=data.get('location', ''),
            user_id=data.get('userId'),
            farm_id=data.get('farmId'),
            auto_capture=data.get('autoCapture', False),
            capture_interval=data.get('captureInterval', 60)
        )
        
        db.session.add(camera)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '카메라가 추가되었습니다',
            'data': camera.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'카메라 추가 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras/<camera_id>', methods=['GET'])
def get_camera(camera_id):
    """특정 카메라 정보 조회"""
    try:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({
                'status': 'error',
                'message': '카메라를 찾을 수 없습니다'
            }), 404
        
        return jsonify({
            'status': 'success',
            'message': '카메라 정보 조회 완료',
            'data': camera.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'카메라 정보 조회 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras/<camera_id>', methods=['PUT'])
def update_camera(camera_id):
    """카메라 정보 업데이트"""
    try:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({
                'status': 'error',
                'message': '카메라를 찾을 수 없습니다'
            }), 404
        
        data = request.get_json()
        
        # 업데이트 가능한 필드들
        if 'name' in data:
            camera.name = data['name']
        if 'location' in data:
            camera.location = data['location']
        if 'autoCapture' in data:
            camera.auto_capture = data['autoCapture']
        if 'captureInterval' in data:
            camera.capture_interval = data['captureInterval']
        if 'isActive' in data:
            camera.is_active = data['isActive']
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '카메라 정보가 업데이트되었습니다',
            'data': camera.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'카메라 정보 업데이트 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras/<camera_id>', methods=['DELETE'])
def delete_camera(camera_id):
    """카메라 삭제"""
    try:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({
                'status': 'error',
                'message': '카메라를 찾을 수 없습니다'
            }), 404
        
        db.session.delete(camera)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '카메라가 삭제되었습니다'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'카메라 삭제 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras/<camera_id>/capture', methods=['POST'])
def capture_image(camera_id):
    """카메라로 이미지 촬영"""
    try:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({
                'status': 'error',
                'message': '카메라를 찾을 수 없습니다'
            }), 404
        
        if not camera.is_active:
            return jsonify({
                'status': 'error',
                'message': '비활성화된 카메라입니다'
            }), 400
        
        # 시뮬레이션된 촬영 결과
        capture_result = {
            'capture_id': str(uuid.uuid4()),
            'camera_id': camera_id,
            'timestamp': datetime.now().isoformat(),
            'image_url': f'/api/v2/camera/images/{camera_id}/latest',
            'status': 'success',
            'file_size': '2.5MB',
            'resolution': '1920x1080'
        }
        
        # 카메라 상태 업데이트
        camera.status = 'online'
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '이미지 촬영 완료',
            'data': capture_result
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'이미지 촬영 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras/<camera_id>/auto-capture', methods=['POST'])
def toggle_auto_capture(camera_id):
    """자동 촬영 토글"""
    try:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({
                'status': 'error',
                'message': '카메라를 찾을 수 없습니다'
            }), 404
        
        # 자동 촬영 상태 토글
        camera.auto_capture = not camera.auto_capture
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'자동 촬영이 {"활성화" if camera.auto_capture else "비활성화"}되었습니다',
            'data': {
                'camera_id': camera_id,
                'auto_capture': camera.auto_capture,
                'capture_interval': camera.capture_interval
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'자동 촬영 설정 실패: {str(e)}'
        }), 500

@camera_bp.route('/cameras/<camera_id>/interval', methods=['PUT'])
def set_capture_interval(camera_id):
    """촬영 간격 설정"""
    try:
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({
                'status': 'error',
                'message': '카메라를 찾을 수 없습니다'
            }), 404
        
        data = request.get_json()
        interval = data.get('interval')
        
        if not interval or interval < 1:
            return jsonify({
                'status': 'error',
                'message': '촬영 간격은 1분 이상이어야 합니다'
            }), 400
        
        camera.capture_interval = interval
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'촬영 간격이 {interval}분으로 설정되었습니다',
            'data': {
                'camera_id': camera_id,
                'capture_interval': interval
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'촬영 간격 설정 실패: {str(e)}'
        }), 500

@camera_bp.route('/stats', methods=['GET'])
def get_camera_stats():
    """카메라 통계 정보"""
    try:
        total_cameras = Camera.query.count()
        active_cameras = Camera.query.filter(Camera.is_active == True).count()
        auto_capture_cameras = Camera.query.filter(Camera.auto_capture == True).count()
        
        # 상태별 통계
        status_stats = db.session.query(
            Camera.status,
            db.func.count(Camera.id).label('count')
        ).group_by(Camera.status).all()
        
        return jsonify({
            'status': 'success',
            'message': '카메라 통계 조회 완료',
            'data': {
                'total_cameras': total_cameras,
                'active_cameras': active_cameras,
                'auto_capture_cameras': auto_capture_cameras,
                'status_distribution': [
                    {'status': stat[0], 'count': stat[1]} 
                    for stat in status_stats
                ],
                'statistics_timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'카메라 통계 조회 실패: {str(e)}'
        }), 500

def _generate_demo_cameras():
    """데모 카메라 데이터 생성"""
    import random
    
    demo_cameras = []
    locations = ['온실 A동', '온실 B동', '실외 재배지', '육묘장', '포장지 1구역', '포장지 2구역']
    
    for i in range(6):
        camera = {
            'id': f'demo_camera_{i+1}',
            'name': f'스마트팜 카메라 {i+1}',
            'location': locations[i],
            'status': random.choice(['online', 'offline', 'recording']),
            'isActive': random.choice([True, True, False]),  # 대부분 활성화
            'autoCapture': random.choice([True, False]),
            'captureInterval': random.choice([30, 60, 120, 300]),
            'createdAt': datetime.now().isoformat(),
            'userId': 'demo_user',
            'farmId': 'demo_farm'
        }
        demo_cameras.append(camera)
    
    return demo_cameras 