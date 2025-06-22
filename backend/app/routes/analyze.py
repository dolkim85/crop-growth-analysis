from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from ..services.ai import PlantAnalysisAI
import os
import uuid
import json

analyze_bp = Blueprint("analyze", __name__, url_prefix="/api/v1")

# AI 분석 서비스 인스턴스
ai_service = PlantAnalysisAI()

@analyze_bp.route("/analyze", methods=["POST"])
def analyze():
    """식물 이미지 및 환경 데이터 분석 API"""
    try:
        # 이미지 파일 확인
        if 'images' not in request.files:
            return jsonify({
                "status": "error", 
                "message": "이미지가 업로드되지 않았습니다."
            }), 400

        files = request.files.getlist('images')
        if not files or files[0].filename == '':
            return jsonify({
                "status": "error", 
                "message": "유효한 이미지가 없습니다."
            }), 400

        # 환경 데이터 및 기타 매개변수 가져오기
        environment_data = json.loads(request.form.get('environmentData', '{}'))
        model_id = request.form.get('modelId', 'basic-analysis-v1')
        analysis_items = json.loads(request.form.get('analysisItems', '[]'))
        plant_type = request.form.get('plantType', 'unknown')

        # 업로드 폴더 확인
        upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        # 분석 결과 리스트
        analysis_results = []

        # 각 이미지 분석
        for file in files:
            if file and _allowed_file(file.filename):
                # 안전한 파일명 생성
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                filepath = os.path.join(upload_folder, unique_filename)
                
                # 파일 저장
                file.save(filepath)
                
                try:
                    # AI 분석 수행
                    result = ai_service.analyze_plant_image(
                        filepath, environment_data, model_id, analysis_items
                    )
                    
                    # 추가 메타데이터
                    result.update({
                        'filename': filename,
                        'plant_type': plant_type,
                        'analysis_timestamp': result.get('timestamp', '실시간'),
                        'file_size': os.path.getsize(filepath)
                    })
                    
                    analysis_results.append(result)
                    
                except Exception as e:
                    return jsonify({
                        "status": "error",
                        "message": f"이미지 분석 중 오류: {str(e)}"
                    }), 500
                
                finally:
                    # 임시 파일 삭제 (선택적)
                    if os.path.exists(filepath):
                        try:
                            os.remove(filepath)
                        except:
                            pass  # 삭제 실패해도 계속 진행

        # 단일 이미지인 경우 첫 번째 결과만 반환, 다중 이미지인 경우 배열 반환
        if len(analysis_results) == 1:
            final_result = analysis_results[0]
        else:
            # 다중 이미지 결과 통합
            final_result = _merge_analysis_results(analysis_results)

        return jsonify({
            "status": "success",
            "message": "분석이 완료되었습니다.",
            "data": final_result
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"서버 오류: {str(e)}"
        }), 500

@analyze_bp.route("/models", methods=["GET"])
def get_models():
    """사용 가능한 AI 모델 목록 반환"""
    models = [
        {
            "id": "basic-analysis-v1",
            "name": "기본 분석 모델 v1.0",
            "category": "무료",
            "accuracy": "85%",
            "description": "식물의 기본적인 건강도, 크기, 색상 분석을 제공합니다.",
            "provider": "SmartFarm AI Lab",
            "features": ["건강도 분석", "색상 분석", "크기 측정", "환경 연동"],
            "analysisItems": [
                {"id": "plantHealth", "name": "식물 건강도", "type": "number", "unit": "%"},
                {"id": "size", "name": "식물 크기", "type": "number", "unit": "cm"},
                {"id": "height", "name": "식물 높이", "type": "number", "unit": "cm"},
                {"id": "leafCount", "name": "잎 개수", "type": "number", "unit": "개"},
                {"id": "condition", "name": "전체 상태", "type": "string", "unit": ""},
                {"id": "leafColor", "name": "잎 색상 분석", "type": "object", "unit": ""}
            ]
        },
        {
            "id": "advanced-cv-v2",
            "name": "고급 컴퓨터 비전 모델 v2.1",
            "category": "무료",
            "accuracy": "92%",
            "description": "OpenCV와 딥러닝을 활용한 정밀 식물 분석을 제공합니다.",
            "provider": "OpenSource CV Team",
            "features": ["정밀 측정", "질병 감지", "성장 예측", "3D 분석"],
            "analysisItems": [
                {"id": "plantHealth", "name": "식물 건강도", "type": "number", "unit": "%"},
                {"id": "size", "name": "식물 크기", "type": "number", "unit": "cm"},
                {"id": "height", "name": "식물 높이", "type": "number", "unit": "cm"},
                {"id": "leafCount", "name": "잎 개수", "type": "number", "unit": "개"},
                {"id": "condition", "name": "전체 상태", "type": "string", "unit": ""},
                {"id": "leafColor", "name": "잎 색상 분석", "type": "object", "unit": ""},
                {"id": "growthStage", "name": "성장 단계", "type": "string", "unit": ""},
                {"id": "diseaseDetection", "name": "질병 감지", "type": "object", "unit": ""}
            ]
        },
        {
            "id": "smart-learning-v3",
            "name": "스마트 학습 AI v3.0",
            "category": "학습AI",
            "accuracy": "94%",
            "description": "사용자 데이터로 지속적으로 학습하는 개인화된 분석 모델입니다.",
            "provider": "Smart AI Research",
            "features": ["개인화 학습", "예측 분석", "시계열 추적", "최적화 권장"],
            "analysisItems": [
                {"id": "plantHealth", "name": "식물 건강도", "type": "number", "unit": "%"},
                {"id": "size", "name": "식물 크기", "type": "number", "unit": "cm"},
                {"id": "height", "name": "식물 높이", "type": "number", "unit": "cm"},
                {"id": "leafCount", "name": "잎 개수", "type": "number", "unit": "개"},
                {"id": "condition", "name": "전체 상태", "type": "string", "unit": ""},
                {"id": "leafColor", "name": "잎 색상 분석", "type": "object", "unit": ""},
                {"id": "growthStage", "name": "성장 단계", "type": "string", "unit": ""},
                {"id": "growthPrediction", "name": "성장 예측", "type": "object", "unit": ""},
                {"id": "optimizationTips", "name": "최적화 팁", "type": "string", "unit": ""}
            ]
        }
    ]
    
    return jsonify({
        "status": "success",
        "message": "모델 목록을 성공적으로 가져왔습니다.",
        "data": models
    })

@analyze_bp.route("/health", methods=["GET"])
def health_check():
    """백엔드 서버 상태 확인"""
    return jsonify({
        "status": "success",
        "message": "AI 백엔드 서버가 정상 작동 중입니다.",
        "version": "1.0.0",
        "services": {
            "image_analysis": "활성",
            "environment_analysis": "활성",
            "model_serving": "활성"
        }
    })

def _allowed_file(filename):
    """허용된 파일 확장자 확인"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _merge_analysis_results(results):
    """다중 이미지 분석 결과 통합"""
    if not results:
        return {}
    
    # 첫 번째 결과를 기본으로 사용
    merged = results[0].copy()
    
    # 수치 데이터는 평균값 계산
    numeric_fields = ['overallScore', 'confidence']
    for field in numeric_fields:
        if field in merged:
            values = [r.get(field, 0) for r in results if field in r]
            merged[field] = sum(values) / len(values) if values else 0
    
    # 분석 데이터 평균 계산
    if 'analysisData' in merged:
        for key, value in merged['analysisData'].items():
            if isinstance(value, (int, float)):
                values = [r.get('analysisData', {}).get(key, 0) for r in results 
                         if isinstance(r.get('analysisData', {}).get(key), (int, float))]
                if values:
                    merged['analysisData'][key] = sum(values) / len(values)
    
    # 권장사항 통합 (중복 제거)
    all_recommendations = []
    for result in results:
        all_recommendations.extend(result.get('recommendations', []))
    merged['recommendations'] = list(dict.fromkeys(all_recommendations))[:5]  # 중복 제거 후 최대 5개
    
    # 메타데이터 업데이트
    merged['image_count'] = len(results)
    merged['analysis_mode'] = 'multi_image'
    
    return merged 