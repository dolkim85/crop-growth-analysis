"""
🌱 스마트팜 백엔드 V2.0 설정
환경별 설정 클래스
"""

import os
from datetime import timedelta

class BaseConfig:
    """기본 설정"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'smartfarm-v2-secret-key-2024'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 파일 업로드 설정
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or './uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # AI 모델 설정
    AI_MODEL_PATH = os.environ.get('AI_MODEL_PATH') or './models'
    
    # 로깅 설정
    LOG_LEVEL = 'INFO'
    
    # API 설정
    API_VERSION = 'v2'
    API_PREFIX = '/api/v2'

class DevelopmentConfig(BaseConfig):
    """개발 환경 설정"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///smartfarm_dev.db'
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(BaseConfig):
    """프로덕션 환경 설정"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///smartfarm_prod.db'
    LOG_LEVEL = 'WARNING'

class TestingConfig(BaseConfig):
    """테스트 환경 설정"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# 설정 딕셔너리
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 