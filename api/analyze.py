"""
🌱 스마트팜 이미지 분석 - Vercel 서버리스 함수
"""

from http.server import BaseHTTPRequestHandler
import json
import base64
from datetime import datetime
import random

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """이미지 분석 처리"""
        try:
            # CORS 헤더 설정
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # 요청 데이터 읽기
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Mock AI 분석 결과 생성
            analysis_result = self.generate_mock_analysis()
            
            response = {
                'status': 'success',
                'message': '이미지 분석 완료',
                'timestamp': datetime.now().isoformat(),
                'data': analysis_result
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'status': 'error',
                'message': f'분석 중 오류 발생: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
            
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """CORS preflight 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def generate_mock_analysis(self):
        """Mock AI 분석 결과 생성"""
        health_conditions = ['매우 좋음', '좋음', '보통', '주의 필요', '위험']
        growth_stages = ['발아기', '유묘기', '생장기', '개화기', '결실기']
        diseases = ['건강함', '잎마름병 의심', '진딧물 발견', '영양 부족', '과습 상태']
        
        return {
            'plant_health': {
                'overall_score': random.randint(70, 95),
                'condition': random.choice(health_conditions),
                'confidence': random.randint(85, 98)
            },
            'growth_analysis': {
                'stage': random.choice(growth_stages),
                'progress': random.randint(60, 90),
                'expected_harvest': f"{random.randint(2, 8)}주 후"
            },
            'disease_detection': {
                'status': random.choice(diseases),
                'risk_level': random.choice(['낮음', '보통', '높음']),
                'affected_area': f"{random.randint(0, 15)}%"
            },
            'recommendations': [
                '적정 온도 유지 (22-25°C)',
                '습도 조절 필요 (60-70%)',
                '주 2-3회 물주기 권장',
                '충분한 햇빛 노출 필요'
            ][:random.randint(2, 4)]
        } 