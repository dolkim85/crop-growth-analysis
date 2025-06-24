import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import sqlite3
import json
import os
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from cryptography.fernet import Fernet
import hashlib

class GlobalPlantModel(nn.Module):
    """글로벌 기본 모델 - 모든 농가 데이터로 학습된 기반 모델"""
    
    def __init__(self, input_size=20, hidden_size=64):
        super().__init__()
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 16)
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 5)  # 건강도, 크기, 높이, 위험도, 성장률
        )
    
    def forward(self, x):
        features = self.feature_extractor(x)
        output = self.classifier(features)
        return features, output

class PersonalizedLayer(nn.Module):
    """농가별 개인화 레이어"""
    
    def __init__(self, feature_size=16, output_size=5):
        super().__init__()
        self.adaptation_layer = nn.Sequential(
            nn.Linear(feature_size, 12),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(12, 8),
            nn.ReLU(),
            nn.Linear(8, output_size)
        )
    
    def forward(self, global_features):
        return self.adaptation_layer(global_features)

class FarmClusterModel(nn.Module):
    """농가 클러스터별 특화 모델"""
    
    def __init__(self, cluster_type: str):
        super().__init__()
        self.cluster_type = cluster_type
        
        # 클러스터별 특화된 아키텍처
        if cluster_type == "smart_greenhouse":
            # 스마트 온실: 환경 데이터 중심
            self.adjustment_layer = nn.Sequential(
                nn.Linear(16, 12),
                nn.ReLU(),
                nn.Linear(12, 5)
            )
        elif cluster_type == "traditional_greenhouse":
            # 전통 온실: 시각적 분석 중심
            self.adjustment_layer = nn.Sequential(
                nn.Linear(16, 10),
                nn.ReLU(),
                nn.Linear(10, 5)
            )
        else:  # open_field
            # 노지 재배: 기상 데이터 중심
            self.adjustment_layer = nn.Sequential(
                nn.Linear(16, 14),
                nn.ReLU(),
                nn.Linear(14, 5)
            )
    
    def forward(self, features):
        return self.adjustment_layer(features)

class FederatedFarmAI:
    """연합학습 기반 하이브리드 농가 AI 시스템"""
    
    def __init__(self, farm_id: str):
        self.farm_id = farm_id
        self.farm_hash = hashlib.md5(farm_id.encode()).hexdigest()[:8]
        
        # 모델 경로 설정
        self.models_dir = "./models/federated"
        self.farm_models_dir = f"{self.models_dir}/farms"
        self.global_model_path = f"{self.models_dir}/global_model.pt"
        self.farm_model_path = f"{self.farm_models_dir}/{self.farm_hash}_personal.pt"
        self.farm_db_path = f"{self.farm_models_dir}/{self.farm_hash}_data.db"
        
        # 디렉토리 생성
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.farm_models_dir, exist_ok=True)
        
        # 모델 초기화
        self.global_model = GlobalPlantModel()
        self.personal_layer = PersonalizedLayer()
        self.cluster_models = self._init_cluster_models()
        self.scaler = StandardScaler()
        
        # 농가 정보
        self.farm_cluster = None
        self.training_data_count = 0
        
        # 암호화 키 (프라이버시 보장)
        self.encryption_key = self._get_or_create_encryption_key()
        
        # 데이터베이스 초기화
        self._init_farm_database()
        
        # 기존 모델 로드
        self._load_models()
    
    def _init_cluster_models(self) -> Dict[str, FarmClusterModel]:
        """클러스터별 모델 초기화"""
        return {
            "smart_greenhouse": FarmClusterModel("smart_greenhouse"),
            "traditional_greenhouse": FarmClusterModel("traditional_greenhouse"),
            "open_field": FarmClusterModel("open_field")
        }
    
    def _get_or_create_encryption_key(self) -> Fernet:
        """농가별 암호화 키 생성/로드"""
        key_path = f"{self.farm_models_dir}/{self.farm_hash}_key.key"
        
        if os.path.exists(key_path):
            with open(key_path, 'rb') as f:
                key = f.read()
        else:
            key = Fernet.generate_key()
            with open(key_path, 'wb') as f:
                f.write(key)
        
        return Fernet(key)
    
    def _init_farm_database(self):
        """농가별 데이터베이스 초기화"""
        conn = sqlite3.connect(self.farm_db_path)
        cursor = conn.cursor()
        
        # 학습 데이터 테이블
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                plant_type TEXT,
                environment_data TEXT,
                image_features TEXT,
                analysis_result TEXT,
                user_feedback INTEGER,
                prediction_accuracy REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 농가 메타데이터 테이블
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS farm_metadata (
                id INTEGER PRIMARY KEY,
                farm_id TEXT UNIQUE,
                cluster_type TEXT,
                facility_type TEXT,
                crop_types TEXT,
                location_info TEXT,
                experience_level INTEGER,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 모델 성능 테이블
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_version TEXT,
                global_accuracy REAL,
                personal_accuracy REAL,
                cluster_accuracy REAL,
                hybrid_accuracy REAL,
                training_samples INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 연합학습 기여 테이블
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS federation_contributions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contribution_hash TEXT,
                model_parameters_size INTEGER,
                privacy_noise_level REAL,
                contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def classify_farm(self, farm_info: Dict) -> str:
        """농가 분류 및 클러스터 할당"""
        # 농가 특성을 기반으로 클러스터 분류
        facility_type = farm_info.get('facility_type', 'greenhouse')
        automation_level = farm_info.get('automation_level', 'medium')
        crop_type = farm_info.get('crop_type', 'leafy_greens')
        
        # 분류 로직
        if facility_type == 'smart_greenhouse' or automation_level == 'high':
            cluster = "smart_greenhouse"
        elif facility_type == 'greenhouse' or facility_type == 'tunnel':
            cluster = "traditional_greenhouse"
        else:
            cluster = "open_field"
        
        self.farm_cluster = cluster
        
        # 메타데이터 저장
        self._save_farm_metadata(farm_info)
        
        return cluster
    
    def _save_farm_metadata(self, farm_info: Dict):
        """농가 메타데이터 저장"""
        conn = sqlite3.connect(self.farm_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO farm_metadata 
            (farm_id, cluster_type, facility_type, crop_types, location_info, experience_level)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            self.farm_id,
            self.farm_cluster,
            farm_info.get('facility_type', 'unknown'),
            json.dumps(farm_info.get('crop_types', [])),
            json.dumps(farm_info.get('location_info', {})),
            farm_info.get('experience_level', 3)
        ))
        
        conn.commit()
        conn.close()
    
    def hybrid_predict(self, input_data: Dict, use_existing_ai: bool = True) -> Dict[str, Any]:
        """하이브리드 예측 - 기존 AI + 연합학습 AI 결합"""
        
        # 입력 데이터 전처리
        processed_input = self._preprocess_input(input_data)
        input_tensor = torch.FloatTensor(processed_input).unsqueeze(0)
        
        predictions = {}
        
        # 기존 AI 시스템 예측 (시뮬레이션)
        if use_existing_ai:
            # 기존 AI 결과 시뮬레이션
            existing_result = {
                'overallScore': 75 + np.random.randint(-10, 15),
                'confidence': 80 + np.random.randint(-5, 15),
                'recommendations': [
                    "물 공급량을 10% 증가시키세요.",
                    "햇빛 노출을 늘려주세요.",
                    "온도를 2도 낮춰주세요."
                ]
            }
            
            predictions['existing_ai'] = {
                'health_score': existing_result.get('overallScore', 75),
                'confidence': existing_result.get('confidence', 80),
                'recommendations': existing_result.get('recommendations', []),
                'weight': 0.3  # 기존 AI 가중치 30%
            }
        
        # 연합학습 하이브리드 예측
        if self.training_data_count >= 10:  # 충분한 데이터가 있을 때만
            # 1단계: 글로벌 모델 예측
            with torch.no_grad():
                global_features, global_output = self.global_model(input_tensor)
            
            # 2단계: 개인화 레이어 적용
            with torch.no_grad():
                personal_output = self.personal_layer(global_features)
            
            # 3단계: 클러스터 모델 보정
            cluster_output = None
            if self.farm_cluster and self.farm_cluster in self.cluster_models:
                with torch.no_grad():
                    cluster_output = self.cluster_models[self.farm_cluster](global_features)
            
            # 하이브리드 결합
            if cluster_output is not None:
                # 3단계 앙상블
                hybrid_output = (
                    global_output * 0.4 +      # 글로벌 40%
                    personal_output * 0.4 +    # 개인화 40%
                    cluster_output * 0.2       # 클러스터 20%
                )
                confidence = 90
            else:
                # 2단계 앙상블
                hybrid_output = (
                    global_output * 0.6 +      # 글로벌 60%
                    personal_output * 0.4      # 개인화 40%
                )
                confidence = 85
            
            predictions['federated_ai'] = {
                'health_score': float(hybrid_output[0][0].item()),
                'predicted_size': float(hybrid_output[0][1].item()),
                'predicted_height': float(hybrid_output[0][2].item()),
                'risk_level': float(hybrid_output[0][3].item()),
                'growth_rate': float(hybrid_output[0][4].item()),
                'confidence': confidence,
                'is_personalized': True,
                'training_samples': self.training_data_count,
                'cluster_type': self.farm_cluster,
                'weight': 0.7  # 연합학습 AI 가중치 70%
            }
        else:
            # 데이터 부족시 글로벌 모델만 사용
            with torch.no_grad():
                global_features, global_output = self.global_model(input_tensor)
            
            predictions['federated_ai'] = {
                'health_score': float(global_output[0][0].item()),
                'predicted_size': float(global_output[0][1].item()),
                'predicted_height': float(global_output[0][2].item()),
                'risk_level': float(global_output[0][3].item()),
                'growth_rate': float(global_output[0][4].item()),
                'confidence': 70,
                'is_personalized': False,
                'training_samples': self.training_data_count,
                'message': f'개인화를 위해 {10 - self.training_data_count}개 더 필요',
                'weight': 0.7
            }
        
        # 최종 결합 예측
        final_prediction = self._combine_predictions(predictions)
        
        return final_prediction
    
    def _combine_predictions(self, predictions: Dict) -> Dict[str, Any]:
        """기존 AI와 연합학습 AI 예측 결합"""
        
        if 'existing_ai' in predictions and 'federated_ai' in predictions:
            existing = predictions['existing_ai']
            federated = predictions['federated_ai']
            
            # 가중 평균 계산
            combined_health = (
                existing['health_score'] * existing['weight'] +
                federated['health_score'] * federated['weight']
            )
            
            combined_confidence = (
                existing['confidence'] * existing['weight'] +
                federated['confidence'] * federated['weight']
            )
            
            # 권장사항 결합
            combined_recommendations = existing.get('recommendations', [])
            if federated.get('is_personalized', False):
                combined_recommendations.append("개인화된 AI 분석이 적용되었습니다.")
            
            return {
                'hybrid_health_score': round(combined_health, 1),
                'hybrid_confidence': round(combined_confidence, 1),
                'existing_ai_result': existing,
                'federated_ai_result': federated,
                'combined_recommendations': combined_recommendations,
                'analysis_type': 'hybrid',
                'personalization_status': federated.get('is_personalized', False),
                'training_progress': f"{self.training_data_count}/10 minimum samples"
            }
        
        elif 'federated_ai' in predictions:
            return predictions['federated_ai']
        elif 'existing_ai' in predictions:
            return predictions['existing_ai']
        else:
            return {'error': 'No predictions available'}
    
    def add_training_data(self, input_data: Dict, actual_result: Dict, user_feedback: Optional[int] = None):
        """학습 데이터 추가"""
        
        # 데이터 암호화 저장
        encrypted_env_data = self.encryption_key.encrypt(
            json.dumps(input_data.get('environment_data', {})).encode()
        )
        encrypted_image_features = self.encryption_key.encrypt(
            json.dumps(input_data.get('image_features', {})).encode()
        )
        
        conn = sqlite3.connect(self.farm_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO training_data 
            (timestamp, plant_type, environment_data, image_features, analysis_result, user_feedback)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now(),
            input_data.get('plant_type', 'unknown'),
            encrypted_env_data.decode(),
            encrypted_image_features.decode(),
            json.dumps(actual_result),
            user_feedback
        ))
        
        conn.commit()
        conn.close()
        
        self.training_data_count += 1
        
        # 자동 재훈련 조건 확인
        if self.training_data_count % 20 == 0:  # 20개마다
            self._retrain_personal_model()
    
    def _preprocess_input(self, input_data: Dict) -> List[float]:
        """입력 데이터 전처리"""
        env_data = input_data.get('environment_data', {})
        img_features = input_data.get('image_features', {})
        
        # 환경 데이터 특성 (8개)
        env_features = [
            env_data.get('innerTemperature', 25.0),
            env_data.get('innerHumidity', 60.0),
            env_data.get('ph', 6.5),
            env_data.get('ec', 2.0),
            env_data.get('dissolvedOxygen', 7.0),
            env_data.get('solarRadiation', 400.0),
            env_data.get('outerTemperature', 22.0),
            env_data.get('rootZoneTemperature', 24.0)
        ]
        
        # 이미지 특성 (12개)
        img_color = img_features.get('color', {})
        img_shape = img_features.get('shape', {})
        
        image_features = [
            img_features.get('health_score', 75.0),
            img_color.get('greenness', 70.0),
            img_color.get('yellowing', 10.0),
            img_color.get('browning', 5.0),
            img_shape.get('leaf_count', 8),
            img_shape.get('total_area', 25000),
            img_features.get('image_quality', 80.0),
            0.0, 0.0, 0.0, 0.0, 0.0  # 패딩
        ]
        
        return env_features + image_features
    
    def _retrain_personal_model(self):
        """개인화 모델 재훈련"""
        print(f"🔄 농가 {self.farm_id} 개인화 모델 재훈련 시작...")
        
        # 학습 데이터 로드
        training_data = self._load_encrypted_training_data()
        
        if len(training_data) < 10:
            print("학습 데이터 부족")
            return
        
        # 데이터 전처리
        X, y = self._prepare_training_data(training_data)
        
        # 개인화 레이어 훈련
        self._train_personal_layer(X, y)
        
        # 모델 저장
        self._save_models()
        
        print(f"✅ 개인화 모델 재훈련 완료 (데이터: {len(training_data)}개)")
    
    def _load_encrypted_training_data(self) -> List[Dict]:
        """암호화된 학습 데이터 로드"""
        conn = sqlite3.connect(self.farm_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT plant_type, environment_data, image_features, analysis_result, user_feedback
            FROM training_data
            ORDER BY created_at DESC
            LIMIT 100
        ''')
        
        data = []
        for row in cursor.fetchall():
            try:
                # 복호화
                env_data = json.loads(
                    self.encryption_key.decrypt(row[1].encode()).decode()
                )
                img_features = json.loads(
                    self.encryption_key.decrypt(row[2].encode()).decode()
                )
                
                data.append({
                    'plant_type': row[0],
                    'environment_data': env_data,
                    'image_features': img_features,
                    'analysis_result': json.loads(row[3]),
                    'user_feedback': row[4]
                })
            except Exception as e:
                print(f"데이터 복호화 실패: {e}")
                continue
        
        conn.close()
        return data
    
    def _prepare_training_data(self, training_data: List[Dict]):
        """훈련 데이터 전처리"""
        X_data = []
        y_data = []
        
        for data in training_data:
            # 입력 특성
            input_features = self._preprocess_input(data)
            X_data.append(input_features)
            
            # 타겟 값
            result = data['analysis_result']
            targets = [
                result.get('overallScore', 75),
                result.get('analysisData', {}).get('size', 20),
                result.get('analysisData', {}).get('height', 25),
                0.3,  # 위험도
                data.get('user_feedback', 3) * 20  # 성장률
            ]
            y_data.append(targets)
        
        X = torch.FloatTensor(X_data)
        y = torch.FloatTensor(y_data)
        
        return X, y
    
    def _train_personal_layer(self, X: torch.Tensor, y: torch.Tensor):
        """개인화 레이어 훈련"""
        optimizer = optim.Adam(self.personal_layer.parameters(), lr=0.001)
        criterion = nn.MSELoss()
        
        # 글로벌 모델에서 특성 추출
        with torch.no_grad():
            global_features, _ = self.global_model(X)
        
        # 개인화 레이어 훈련
        for epoch in range(50):
            optimizer.zero_grad()
            personal_output = self.personal_layer(global_features)
            loss = criterion(personal_output, y)
            loss.backward()
            optimizer.step()
            
            if epoch % 10 == 0:
                print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
    
    def _load_models(self):
        """저장된 모델들 로드"""
        # 글로벌 모델 로드
        if os.path.exists(self.global_model_path):
            try:
                self.global_model.load_state_dict(torch.load(self.global_model_path))
                print("✅ 글로벌 모델 로드 완료")
            except:
                print("⚠️ 글로벌 모델 로드 실패, 기본 모델 사용")
        
        # 개인화 모델 로드
        if os.path.exists(self.farm_model_path):
            try:
                self.personal_layer.load_state_dict(torch.load(self.farm_model_path))
                print(f"✅ 농가 {self.farm_hash} 개인화 모델 로드 완료")
            except:
                print("⚠️ 개인화 모델 로드 실패, 기본 모델 사용")
        
        # 훈련 데이터 개수 로드
        if os.path.exists(self.farm_db_path):
            try:
                conn = sqlite3.connect(self.farm_db_path)
                cursor = conn.cursor()
                cursor.execute('SELECT COUNT(*) FROM training_data')
                self.training_data_count = cursor.fetchone()[0]
                conn.close()
            except:
                self.training_data_count = 0
    
    def _save_models(self):
        """모델들 저장"""
        # 개인화 모델 저장
        torch.save(self.personal_layer.state_dict(), self.farm_model_path)
        print(f"💾 농가 {self.farm_hash} 개인화 모델 저장 완료")
    
    def get_farm_analytics(self) -> Dict[str, Any]:
        """농가 분석 현황"""
        return {
            'farm_id': self.farm_id,
            'farm_hash': self.farm_hash,
            'cluster_type': self.farm_cluster,
            'training_data_count': self.training_data_count,
            'personalization_ready': self.training_data_count >= 10,
            'next_retrain_at': self.training_data_count + (20 - (self.training_data_count % 20)),
            'model_status': {
                'global_model': os.path.exists(self.global_model_path),
                'personal_model': os.path.exists(self.farm_model_path),
                'cluster_models': list(self.cluster_models.keys())
            }
        }

class FederationCoordinator:
    """연합학습 코디네이터 - 전체 시스템 관리"""
    
    def __init__(self):
        self.models_dir = "./models/federated"
        self.global_model_path = f"{self.models_dir}/global_model.pt"
        self.federation_db_path = f"{self.models_dir}/federation.db"
        
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.global_model = GlobalPlantModel()
        self._init_federation_database()
    
    def _init_federation_database(self):
        """연합학습 통계 데이터베이스 초기화"""
        conn = sqlite3.connect(self.federation_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS global_model_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT,
                participating_farms INTEGER,
                total_samples INTEGER,
                global_accuracy REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS farm_clusters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cluster_name TEXT,
                cluster_description TEXT,
                farm_count INTEGER,
                average_accuracy REAL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def aggregate_farm_models(self, farm_models: List[Dict]) -> bool:
        """농가 모델들을 집계하여 글로벌 모델 업데이트"""
        try:
            print(f"🔄 {len(farm_models)}개 농가 모델 집계 시작...")
            
            # 연합 평균 (Federated Averaging)
            aggregated_params = {}
            
            for param_name in self.global_model.state_dict().keys():
                param_sum = torch.zeros_like(self.global_model.state_dict()[param_name])
                
                for farm_model in farm_models:
                    if param_name in farm_model['parameters']:
                        param_sum += farm_model['parameters'][param_name]
                
                aggregated_params[param_name] = param_sum / len(farm_models)
            
            # 글로벌 모델 업데이트
            self.global_model.load_state_dict(aggregated_params)
            
            # 모델 저장
            torch.save(self.global_model.state_dict(), self.global_model_path)
            
            print("✅ 글로벌 모델 업데이트 완료")
            return True
            
        except Exception as e:
            print(f"❌ 모델 집계 실패: {e}")
            return False
    
    def get_federation_status(self) -> Dict[str, Any]:
        """연합학습 전체 현황"""
        conn = sqlite3.connect(self.federation_db_path)
        cursor = conn.cursor()
        
        # 최신 글로벌 모델 정보
        cursor.execute('''
            SELECT * FROM global_model_versions 
            ORDER BY created_at DESC LIMIT 1
        ''')
        latest_version = cursor.fetchone()
        
        # 클러스터 정보
        cursor.execute('SELECT * FROM farm_clusters')
        clusters = cursor.fetchall()
        
        conn.close()
        
        return {
            'global_model_version': latest_version[1] if latest_version else "v1.0",
            'participating_farms': latest_version[2] if latest_version else 0,
            'total_training_samples': latest_version[3] if latest_version else 0,
            'global_accuracy': latest_version[4] if latest_version else 0.0,
            'active_clusters': len(clusters),
            'federation_status': "active" if latest_version else "initializing"
        } 