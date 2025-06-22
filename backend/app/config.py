import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'crop-growth-analysis-secret-2024')
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # AI 모델 설정
    AI_MODEL_PATH = os.getenv('AI_MODEL_PATH', './models/')
    CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.7))
    
    # 환경 데이터 임계값
    TEMPERATURE_MIN = 18
    TEMPERATURE_MAX = 32
    HUMIDITY_MIN = 40
    HUMIDITY_MAX = 80
    PH_MIN = 6.0
    PH_MAX = 7.5
    EC_MIN = 1.0
    EC_MAX = 3.0
    DO_MIN = 5.0
    DO_MAX = 12.0 