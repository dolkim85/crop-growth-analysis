"""
🌱 실시간 분석 라우트
프론트엔드 '실시간 분석' 탭 완전 대응
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import json
from app.services.ai_service import ai_service
from app.models.plant import AnalysisResult, PlantImage, EnvironmentData
from app import db

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v2/analysis')

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_images():
    """이미지 분석 - 프론트엔드 runAnalysis 함수 대응"""
    try:
        # 파일 업로드 확인
        if 'images' not in request.files:
            return jsonify({
                'status': 'error',
                'message': '이미지 파일이 없습니다'
            }), 400
        
        files = request.files.getlist('images')
        if not files or files[0].filename == '':
            return jsonify({
                'status': 'error',
                'message': '선택된 이미지가 없습니다'
            }), 400
        
        # 요청 데이터 파싱
        model_id = request.form.get('modelId', 'plant_health_v2')
        plant_type = request.form.get('plantType', 'tomato')
        analysis_items = json.loads(request.form.get('analysisItems', '[]'))
        environment_data = request.form.get('environmentData')
        
        results = []
        
        for file in files:
            if file and _allowed_file(file.filename):
                # 파일 저장
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
                
                # 업로드 폴더 생성
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                file.save(filepath)
                
                # AI 분석 수행
                analysis_result = ai_service.analyze_plant_image(filepath, plant_type)
                
                # 데이터베이스에 결과 저장
                db_result = AnalysisResult(
                    model_id=model_id,
                    analysis_items=json.dumps(analysis_items),
                    analysis_data=json.dumps({
                        'health_status': analysis_result.health_status,
                        'growth_stage': analysis_result.growth_stage,
                        'disease_detected': analysis_result.disease_detected,
                        'pest_detected': analysis_result.pest_detected,
                        'confidence_score': analysis_result.confidence_score
                    }),
                    condition=analysis_result.health_status,
                    recommendations=json.dumps(analysis_result.recommendations)
                )
                
                db.session.add(db_result)
                db.session.commit()
                
                # 프론트엔드 형식으로 결과 변환
                result = {
                    'id': db_result.id,
                    'filename': filename,
                    'health_status': analysis_result.health_status,
                    'growth_stage': analysis_result.growth_stage,
                    'disease_detected': analysis_result.disease_detected,
                    'pest_detected': analysis_result.pest_detected,
                    'recommendations': analysis_result.recommendations,
                    'confidence_score': analysis_result.confidence_score,
                    'analysis_timestamp': analysis_result.analysis_timestamp,
                    'model_used': model_id
                }
                
                results.append(result)
        
        return jsonify({
            'status': 'success',
            'message': f'{len(results)}개 이미지 분석 완료',
            'data': {
                'results': results,
                'total_analyzed': len(results),
                'analysis_timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Analysis failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'분석 실패: {str(e)}'
        }), 500

@analysis_bp.route('/models', methods=['GET'])
def get_available_models():
    """사용 가능한 AI 모델 목록 - 프론트엔드 aiModels 대응"""
    try:
        models = ai_service.get_available_models()
        
        return jsonify({
            'status': 'success',
            'message': 'AI 모델 목록 조회 완료',
            'data': {
                'models': models,
                'total_count': len(models)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'모델 목록 조회 실패: {str(e)}'
        }), 500

@analysis_bp.route('/history', methods=['GET'])
def get_analysis_history():
    """분석 이력 조회"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # 페이지네이션으로 분석 결과 조회
        pagination = AnalysisResult.query.order_by(
            AnalysisResult.date.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        results = []
        for result in pagination.items:
            results.append(result.to_dict())
        
        return jsonify({
            'status': 'success',
            'message': '분석 이력 조회 완료',
            'data': {
                'results': results,
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
            'message': f'분석 이력 조회 실패: {str(e)}'
        }), 500

@analysis_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """분석 결과 피드백 제출"""
    try:
        data = request.get_json()
        
        analysis_id = data.get('analysisId')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        if not analysis_id or rating is None:
            return jsonify({
                'status': 'error',
                'message': '분석 ID와 평점이 필요합니다'
            }), 400
        
        # 분석 결과 조회
        analysis = AnalysisResult.query.get(analysis_id)
        if not analysis:
            return jsonify({
                'status': 'error',
                'message': '분석 결과를 찾을 수 없습니다'
            }), 404
        
        # 피드백 정보 업데이트 (간단한 구현)
        feedback_data = {
            'rating': rating,
            'comment': comment,
            'timestamp': datetime.now().isoformat()
        }
        
        # 기존 분석 데이터에 피드백 추가
        existing_data = json.loads(analysis.analysis_data) if analysis.analysis_data else {}
        existing_data['feedback'] = feedback_data
        analysis.analysis_data = json.dumps(existing_data)
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '피드백이 성공적으로 제출되었습니다',
            'data': {
                'analysis_id': analysis_id,
                'feedback': feedback_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'피드백 제출 실패: {str(e)}'
        }), 500

def _allowed_file(filename):
    """허용된 파일 형식 확인"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS 