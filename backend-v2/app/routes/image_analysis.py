"""
🌱 이미지 분석 라우트
프론트엔드 '이미지 분석' 탭 완전 대응
"""

from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import json
from app.models.plant import PlantImage
from app import db

image_analysis_bp = Blueprint('image_analysis', __name__, url_prefix='/api/v2/image-analysis')

@image_analysis_bp.route('/upload', methods=['POST'])
def upload_images():
    """이미지 업로드 - 프론트엔드 ImageAnalysis 컴포넌트 대응"""
    try:
        if 'images' not in request.files:
            return jsonify({
                'status': 'error',
                'message': '이미지 파일이 없습니다'
            }), 400
        
        files = request.files.getlist('images')
        uploaded_images = []
        
        for file in files:
            if file and _allowed_file(file.filename):
                # 파일 저장
                filename = secure_filename(file.filename)
                unique_id = str(uuid.uuid4())
                unique_filename = f"{unique_id}_{filename}"
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
                
                # 업로드 폴더 생성
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                file.save(filepath)
                
                # 데이터베이스에 이미지 정보 저장
                plant_image = PlantImage(
                    id=unique_id,
                    filename=filename,
                    file_path=filepath,
                    file_size=os.path.getsize(filepath),
                    user_id=request.form.get('userId'),
                    farm_id=request.form.get('farmId'),
                    plant_type=request.form.get('plantType', 'tomato')
                )
                
                db.session.add(plant_image)
                uploaded_images.append(plant_image.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'{len(uploaded_images)}개 이미지 업로드 완료',
            'data': {
                'images': uploaded_images,
                'total_count': len(uploaded_images)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Image upload failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'이미지 업로드 실패: {str(e)}'
        }), 500

@image_analysis_bp.route('/images', methods=['GET'])
def get_images():
    """이미지 목록 조회"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        plant_type = request.args.get('plant_type')
        user_id = request.args.get('user_id')
        
        query = PlantImage.query
        
        # 필터링
        if plant_type:
            query = query.filter(PlantImage.plant_type == plant_type)
        if user_id:
            query = query.filter(PlantImage.user_id == user_id)
        
        # 페이지네이션
        pagination = query.order_by(
            PlantImage.timestamp.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        images = []
        for image in pagination.items:
            images.append(image.to_dict())
        
        return jsonify({
            'status': 'success',
            'message': '이미지 목록 조회 완료',
            'data': {
                'images': images,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'이미지 목록 조회 실패: {str(e)}'
        }), 500

@image_analysis_bp.route('/images/<image_id>', methods=['GET'])
def get_image(image_id):
    """이미지 파일 반환"""
    try:
        image = PlantImage.query.get(image_id)
        if not image:
            return jsonify({
                'status': 'error',
                'message': '이미지를 찾을 수 없습니다'
            }), 404
        
        if not os.path.exists(image.file_path):
            return jsonify({
                'status': 'error',
                'message': '이미지 파일이 존재하지 않습니다'
            }), 404
        
        return send_file(image.file_path, as_attachment=False)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'이미지 조회 실패: {str(e)}'
        }), 500

@image_analysis_bp.route('/images/<image_id>', methods=['DELETE'])
def delete_image(image_id):
    """이미지 삭제"""
    try:
        image = PlantImage.query.get(image_id)
        if not image:
            return jsonify({
                'status': 'error',
                'message': '이미지를 찾을 수 없습니다'
            }), 404
        
        # 파일 삭제
        if os.path.exists(image.file_path):
            os.remove(image.file_path)
        
        # 데이터베이스에서 삭제
        db.session.delete(image)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '이미지가 삭제되었습니다'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'이미지 삭제 실패: {str(e)}'
        }), 500

@image_analysis_bp.route('/batch-delete', methods=['POST'])
def batch_delete_images():
    """이미지 일괄 삭제"""
    try:
        data = request.get_json()
        image_ids = data.get('imageIds', [])
        
        if not image_ids:
            return jsonify({
                'status': 'error',
                'message': '삭제할 이미지 ID가 없습니다'
            }), 400
        
        deleted_count = 0
        
        for image_id in image_ids:
            image = PlantImage.query.get(image_id)
            if image:
                # 파일 삭제
                if os.path.exists(image.file_path):
                    os.remove(image.file_path)
                
                # 데이터베이스에서 삭제
                db.session.delete(image)
                deleted_count += 1
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'{deleted_count}개 이미지가 삭제되었습니다',
            'data': {
                'deleted_count': deleted_count,
                'requested_count': len(image_ids)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'이미지 일괄 삭제 실패: {str(e)}'
        }), 500

@image_analysis_bp.route('/stats', methods=['GET'])
def get_image_stats():
    """이미지 통계 정보"""
    try:
        # 전체 이미지 수
        total_count = PlantImage.query.count()
        
        # 식물 종류별 통계
        plant_stats = db.session.query(
            PlantImage.plant_type,
            db.func.count(PlantImage.id).label('count')
        ).group_by(PlantImage.plant_type).all()
        
        # 분석 상태별 통계
        status_stats = db.session.query(
            PlantImage.analysis_status,
            db.func.count(PlantImage.id).label('count')
        ).group_by(PlantImage.analysis_status).all()
        
        # 최근 업로드 통계 (최근 7일)
        from datetime import timedelta
        recent_date = datetime.now() - timedelta(days=7)
        recent_count = PlantImage.query.filter(
            PlantImage.timestamp >= recent_date
        ).count()
        
        return jsonify({
            'status': 'success',
            'message': '이미지 통계 조회 완료',
            'data': {
                'total_images': total_count,
                'recent_uploads': recent_count,
                'plant_type_stats': [
                    {'plant_type': stat[0], 'count': stat[1]} 
                    for stat in plant_stats
                ],
                'analysis_status_stats': [
                    {'status': stat[0], 'count': stat[1]} 
                    for stat in status_stats
                ],
                'statistics_timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'이미지 통계 조회 실패: {str(e)}'
        }), 500

def _allowed_file(filename):
    """허용된 파일 형식 확인"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS 