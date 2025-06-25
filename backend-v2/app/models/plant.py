"""
🌱 스마트팜 데이터 모델
프론트엔드 인터페이스와 완전 호환
"""

from datetime import datetime
from dataclasses import dataclass
from typing import Optional, Dict, List, Any
from app import db

class EnvironmentData(db.Model):
    """환경 데이터 모델 - 프론트엔드 EnvironmentData 인터페이스 대응"""
    __tablename__ = 'environment_data'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # 온도 데이터
    inner_temperature = db.Column(db.Float, nullable=False, comment='내부온도')
    outer_temperature = db.Column(db.Float, nullable=False, comment='외부온도')
    root_zone_temperature = db.Column(db.Float, nullable=False, comment='근권온도')
    
    # 습도 및 환경
    inner_humidity = db.Column(db.Float, nullable=False, comment='내부습도')
    solar_radiation = db.Column(db.Float, nullable=False, comment='일사량')
    
    # 양액 데이터
    ph = db.Column(db.Float, nullable=False, comment='PH')
    ec = db.Column(db.Float, nullable=False, comment='EC')
    dissolved_oxygen = db.Column(db.Float, nullable=False, comment='용존산소')
    
    # 메타데이터
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, comment='측정시간')
    farm_id = db.Column(db.String(100), nullable=True, comment='농가ID')
    sensor_id = db.Column(db.String(100), nullable=True, comment='센서ID')
    
    def to_dict(self) -> Dict[str, Any]:
        """프론트엔드 EnvironmentData 인터페이스 형식으로 변환"""
        return {
            'innerTemperature': self.inner_temperature,
            'outerTemperature': self.outer_temperature,
            'rootZoneTemperature': self.root_zone_temperature,
            'innerHumidity': self.inner_humidity,
            'solarRadiation': self.solar_radiation,
            'ph': self.ph,
            'ec': self.ec,
            'dissolvedOxygen': self.dissolved_oxygen,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class PlantImage(db.Model):
    """식물 이미지 모델 - 프론트엔드 UploadedImage 인터페이스 대응"""
    __tablename__ = 'plant_images'
    
    id = db.Column(db.String(100), primary_key=True, comment='이미지ID')
    filename = db.Column(db.String(255), nullable=False, comment='파일명')
    file_path = db.Column(db.String(500), nullable=False, comment='파일경로')
    file_size = db.Column(db.Integer, nullable=True, comment='파일크기')
    
    # 메타데이터
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, comment='업로드시간')
    user_id = db.Column(db.String(100), nullable=True, comment='사용자ID')
    farm_id = db.Column(db.String(100), nullable=True, comment='농가ID')
    
    # 분석 관련
    analysis_status = db.Column(db.String(50), default='pending', comment='분석상태')
    plant_type = db.Column(db.String(100), nullable=True, comment='식물종류')
    
    def to_dict(self) -> Dict[str, Any]:
        """프론트엔드 UploadedImage 인터페이스 형식으로 변환"""
        return {
            'id': self.id,
            'filename': self.filename,
            'url': f'/api/v2/images/{self.id}',
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'userId': self.user_id,
            'fileSize': self.file_size,
            'plantType': self.plant_type,
            'analysisStatus': self.analysis_status
        }

class AnalysisResult(db.Model):
    """분석 결과 모델 - 프론트엔드 AnalysisResult 인터페이스 대응"""
    __tablename__ = 'analysis_results'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # 분석 메타데이터
    model_id = db.Column(db.String(100), nullable=False, comment='AI모델ID')
    analysis_items = db.Column(db.Text, nullable=True, comment='분석항목JSON')
    
    # 분석 데이터
    analysis_data = db.Column(db.Text, nullable=True, comment='분석데이터JSON')
    environment_data_id = db.Column(db.Integer, db.ForeignKey('environment_data.id'), nullable=True)
    
    # 결과
    condition = db.Column(db.String(50), nullable=True, comment='상태')
    recommendations = db.Column(db.Text, nullable=True, comment='권장사항JSON')
    
    # 메타데이터
    date = db.Column(db.DateTime, default=datetime.utcnow, comment='분석일시')
    compared_images = db.Column(db.Text, nullable=True, comment='비교이미지JSON')
    user_id = db.Column(db.String(100), nullable=True, comment='사용자ID')
    
    # 관계
    environment_data = db.relationship('EnvironmentData', backref='analysis_results')
    
    def to_dict(self) -> Dict[str, Any]:
        """프론트엔드 AnalysisResult 인터페이스 형식으로 변환"""
        import json
        
        return {
            'modelId': self.model_id,
            'selectedAnalysisItems': json.loads(self.analysis_items) if self.analysis_items else [],
            'analysisData': json.loads(self.analysis_data) if self.analysis_data else {},
            'environmentData': self.environment_data.to_dict() if self.environment_data else None,
            'condition': self.condition,
            'recommendations': json.loads(self.recommendations) if self.recommendations else [],
            'date': self.date.isoformat() if self.date else None,
            'comparedImages': json.loads(self.compared_images) if self.compared_images else []
        }

class Camera(db.Model):
    """카메라 모델 - 프론트엔드 ObservationCamera 인터페이스 대응"""
    __tablename__ = 'cameras'
    
    id = db.Column(db.String(100), primary_key=True, comment='카메라ID')
    name = db.Column(db.String(255), nullable=False, comment='카메라명')
    location = db.Column(db.String(255), nullable=True, comment='위치')
    
    # 상태
    status = db.Column(db.String(50), default='offline', comment='상태')
    is_active = db.Column(db.Boolean, default=True, comment='활성여부')
    
    # 설정
    auto_capture = db.Column(db.Boolean, default=False, comment='자동촬영')
    capture_interval = db.Column(db.Integer, default=60, comment='촬영간격(분)')
    
    # 메타데이터
    created_at = db.Column(db.DateTime, default=datetime.utcnow, comment='생성일시')
    user_id = db.Column(db.String(100), nullable=True, comment='사용자ID')
    farm_id = db.Column(db.String(100), nullable=True, comment='농가ID')
    
    def to_dict(self) -> Dict[str, Any]:
        """프론트엔드 ObservationCamera 인터페이스 형식으로 변환"""
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'status': self.status,
            'isActive': self.is_active,
            'autoCapture': self.auto_capture,
            'captureInterval': self.capture_interval,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'userId': self.user_id,
            'farmId': self.farm_id
        }

@dataclass
class AIModel:
    """AI 모델 정보 - 프론트엔드 호환"""
    id: str
    name: str
    category: str
    accuracy: str
    description: str
    isActive: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'accuracy': self.accuracy,
            'description': self.description,
            'isActive': self.isActive
        } 