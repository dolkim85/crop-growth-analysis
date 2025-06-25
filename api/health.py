"""
🌱 스마트팜 백엔드 헬스체크 - Vercel 서버리스 함수
"""

from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """헬스체크 응답"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = {
            'status': 'success',
            'message': '🌱 스마트팜 백엔드 V2.0 Vercel 서버리스 정상 작동',
            'version': '2.0.0-vercel',
            'timestamp': datetime.now().isoformat(),
            'platform': 'Vercel Serverless',
            'data': {
                'server_status': 'healthy',
                'services': {
                    'ai_engine': 'active',
                    'serverless': 'running'
                }
            }
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """CORS preflight 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 