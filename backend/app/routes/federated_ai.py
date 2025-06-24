from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from ..services.federated_learning import FederatedFarmAI, FederationCoordinator
import os
import json
import uuid

federated_bp = Blueprint("federated", __name__, url_prefix="/api/v1/federated")

# 연합학습 코디네이터 인스턴스
federation_coordinator = FederationCoordinator()

@federated_bp.route("/analyze", methods=["POST"])
def hybrid_analyze():
    """하이브리드 AI 분석 - 기존 AI + 연합학습 AI 결합"""
    try:
        # 요청 데이터 파싱
        farm_id = request.form.get('farmId', 'demo_farm')
        environment_data = json.loads(request.form.get('environmentData', '{}'))
        model_id = request.form.get('modelId', 'federated-hybrid')
        analysis_items = json.loads(request.form.get('analysisItems', '[]'))
        plant_type = request.form.get('plantType', 'unknown')
        use_existing_ai = request.form.get('useExistingAI', 'true').lower() == 'true'
        
        # 이미지 처리
        image_path = None
        if 'images' in request.files:
            files = request.files.getlist('images')
            if files and files[0].filename != '':
                file = files[0]
                filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
                upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
                os.makedirs(upload_folder, exist_ok=True)
                image_path = os.path.join(upload_folder, filename)
                file.save(image_path)
        
        # 연합학습 AI 인스턴스 생성
        federated_ai = FederatedFarmAI(farm_id)
        
        # 농가 정보가 있다면 클러스터 분류
        if 'farmInfo' in request.form:
            farm_info = json.loads(request.form.get('farmInfo'))
            cluster = federated_ai.classify_farm(farm_info)
            print(f"농가 {farm_id} 클러스터: {cluster}")
        
        # 입력 데이터 구성
        input_data = {
            'farm_id': farm_id,
            'image_path': image_path or '',
            'environment_data': environment_data,
            'model_id': model_id,
            'analysis_items': analysis_items,
            'plant_type': plant_type,
            'image_features': {}  # 이미지 특성은 기존 AI에서 추출
        }
        
        # 기존 AI로 이미지 특성 추출 (필요한 경우)
        if image_path and use_existing_ai:
            from ..services.ai import PlantAnalysisAI
            existing_ai = PlantAnalysisAI()
            
            try:
                existing_result = existing_ai.analyze_plant_image(
                    image_path, environment_data, model_id, analysis_items
                )
                
                # 이미지 특성 추출
                input_data['image_features'] = existing_result.get('imageAnalysis', {})
                
            except Exception as e:
                print(f"기존 AI 이미지 분석 실패: {e}")
                # 기본 이미지 특성 사용
                input_data['image_features'] = {
                    'health_score': 75,
                    'color': {'greenness': 70, 'yellowing': 10, 'browning': 5},
                    'shape': {'leaf_count': 8, 'total_area': 25000},
                    'image_quality': 80
                }
        
        # 하이브리드 예측 수행
        result = federated_ai.hybrid_predict(input_data, use_existing_ai)
        
        # 농가 분석 현황 추가
        farm_analytics = federated_ai.get_farm_analytics()
        result['farm_analytics'] = farm_analytics
        
        return jsonify({
            "status": "success",
            "message": "하이브리드 AI 분석 완료",
            "data": result,
            "analysis_type": "federated_hybrid",
            "farm_id": farm_id
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"하이브리드 분석 실패: {str(e)}"
        }), 500

@federated_bp.route("/feedback", methods=["POST"])
def add_training_feedback():
    """사용자 피드백 추가 및 학습 데이터 업데이트"""
    try:
        data = request.get_json()
        
        farm_id = data.get('farmId')
        input_data = data.get('inputData', {})
        actual_result = data.get('actualResult', {})
        user_feedback = data.get('userFeedback')  # 1-5 점수
        
        if not farm_id:
            return jsonify({
                "status": "error",
                "message": "농가 ID가 필요합니다."
            }), 400
        
        # 연합학습 AI 인스턴스
        federated_ai = FederatedFarmAI(farm_id)
        
        # 학습 데이터 추가
        federated_ai.add_training_data(input_data, actual_result, user_feedback)
        
        # 업데이트된 분석 현황
        analytics = federated_ai.get_farm_analytics()
        
        return jsonify({
            "status": "success",
            "message": "피드백이 개인화 학습에 반영되었습니다.",
            "farm_analytics": analytics
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"피드백 처리 실패: {str(e)}"
        }), 500

@federated_bp.route("/farm-analytics/<farm_id>", methods=["GET"])
def get_farm_analytics(farm_id):
    """농가별 학습 현황 조회"""
    try:
        federated_ai = FederatedFarmAI(farm_id)
        analytics = federated_ai.get_farm_analytics()
        
        return jsonify({
            "status": "success",
            "data": analytics
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"분석 현황 조회 실패: {str(e)}"
        }), 500

@federated_bp.route("/farm-classification", methods=["POST"])
def classify_farm():
    """농가 분류 및 클러스터 할당"""
    try:
        data = request.get_json()
        
        farm_id = data.get('farmId')
        farm_info = data.get('farmInfo', {})
        
        if not farm_id:
            return jsonify({
                "status": "error",
                "message": "농가 ID가 필요합니다."
            }), 400
        
        federated_ai = FederatedFarmAI(farm_id)
        cluster = federated_ai.classify_farm(farm_info)
        
        return jsonify({
            "status": "success",
            "message": "농가 분류 완료",
            "data": {
                "farm_id": farm_id,
                "cluster_type": cluster,
                "farm_info": farm_info
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"농가 분류 실패: {str(e)}"
        }), 500

@federated_bp.route("/federation-status", methods=["GET"])
def get_federation_status():
    """연합학습 전체 현황"""
    try:
        status = federation_coordinator.get_federation_status()
        
        return jsonify({
            "status": "success",
            "data": status
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"연합학습 현황 조회 실패: {str(e)}"
        }), 500

@federated_bp.route("/models", methods=["GET"])
def get_federated_models():
    """연합학습 모델 목록"""
    try:
        models = [
            {
                "id": "federated-hybrid",
                "name": "연합학습 하이브리드 모델",
                "category": "연합학습",
                "accuracy": "진화형 (사용할수록 향상)",
                "description": "기존 AI + 개인화 학습 + 농가 클러스터 분석을 결합한 하이브리드 모델입니다.",
                "provider": "Federated AI System",
                "features": [
                    "기존 AI 시스템 통합",
                    "농가별 개인화 학습", 
                    "클러스터 기반 특화 분석",
                    "프라이버시 보장 연합학습",
                    "실시간 모델 업데이트"
                ],
                "analysisItems": [
                    {"id": "hybrid_health_score", "name": "하이브리드 건강도", "type": "number", "unit": "%"},
                    {"id": "personalized_prediction", "name": "개인화 예측", "type": "object", "unit": ""},
                    {"id": "cluster_analysis", "name": "클러스터 분석", "type": "object", "unit": ""},
                    {"id": "learning_progress", "name": "학습 진행도", "type": "object", "unit": ""},
                    {"id": "farm_recommendations", "name": "농가별 맞춤 권장사항", "type": "string", "unit": ""}
                ]
            },
            {
                "id": "personalized-only",
                "name": "개인화 전용 모델",
                "category": "개인화",
                "accuracy": "농가별 최적화",
                "description": "해당 농가 데이터만으로 학습한 전용 모델입니다.",
                "provider": "Personal AI Engine",
                "features": [
                    "100% 농가 맞춤형",
                    "프라이버시 완전 보장",
                    "농가별 특수 상황 반영",
                    "지속적 성능 개선"
                ],
                "analysisItems": [
                    {"id": "personal_health", "name": "개인화 건강도", "type": "number", "unit": "%"},
                    {"id": "growth_prediction", "name": "성장 예측", "type": "object", "unit": ""},
                    {"id": "risk_assessment", "name": "위험도 평가", "type": "number", "unit": "%"},
                    {"id": "custom_recommendations", "name": "맞춤 권장사항", "type": "string", "unit": ""}
                ]
            },
            {
                "id": "global-baseline",
                "name": "글로벌 기준 모델",
                "category": "기준모델",
                "accuracy": "85%",
                "description": "모든 농가 데이터로 학습한 범용 기준 모델입니다.",
                "provider": "Global AI Network",
                "features": [
                    "광범위한 데이터 기반",
                    "일반적 상황 대응",
                    "신규 농가 즉시 사용",
                    "안정적 성능"
                ],
                "analysisItems": [
                    {"id": "global_health", "name": "글로벌 건강도", "type": "number", "unit": "%"},
                    {"id": "standard_analysis", "name": "표준 분석", "type": "object", "unit": ""},
                    {"id": "general_recommendations", "name": "일반 권장사항", "type": "string", "unit": ""}
                ]
            }
        ]
        
        return jsonify({
            "status": "success",
            "message": "연합학습 모델 목록을 성공적으로 가져왔습니다.",
            "data": models
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"모델 목록 조회 실패: {str(e)}"
        }), 500

@federated_bp.route("/cluster-info/<cluster_type>", methods=["GET"])
def get_cluster_info(cluster_type):
    """클러스터별 상세 정보"""
    try:
        cluster_info = {
            "smart_greenhouse": {
                "name": "스마트 온실",
                "description": "고도 자동화된 스마트 온실 농가",
                "characteristics": [
                    "정밀 환경 제어",
                    "IoT 센서 다수 활용",
                    "데이터 집약적 관리",
                    "자동화 시스템 운영"
                ],
                "optimal_crops": ["토마토", "딸기", "파프리카", "오이"],
                "analysis_focus": "환경 데이터 중심 정밀 분석"
            },
            "traditional_greenhouse": {
                "name": "전통 온실",
                "description": "경험 기반 관리하는 전통적 온실 농가",
                "characteristics": [
                    "수동 환경 관리",
                    "경험 중심 재배",
                    "비용 효율적 운영",
                    "시각적 관찰 중심"
                ],
                "optimal_crops": ["상추", "시금치", "배추", "무"],
                "analysis_focus": "시각적 분석 중심 실용적 접근"
            },
            "open_field": {
                "name": "노지 재배",
                "description": "야외 환경에서 대면적 재배하는 농가",
                "characteristics": [
                    "기상 조건 의존",
                    "계절성 강함",
                    "대면적 관리",
                    "자연 환경 활용"
                ],
                "optimal_crops": ["벼", "옥수수", "콩", "감자"],
                "analysis_focus": "기상 데이터 연동 장기 예측"
            }
        }
        
        if cluster_type not in cluster_info:
            return jsonify({
                "status": "error",
                "message": "존재하지 않는 클러스터 타입입니다."
            }), 404
        
        return jsonify({
            "status": "success",
            "data": cluster_info[cluster_type]
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"클러스터 정보 조회 실패: {str(e)}"
        }), 500 