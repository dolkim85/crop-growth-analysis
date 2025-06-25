"""
🌱 환경 데이터 라우트
프론트엔드 '환경 데이터' 탭 완전 대응
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import random
import json
from app.models.plant import EnvironmentData
from app import db

environment_bp = Blueprint('environment', __name__, url_prefix='/api/v2/environment')

@environment_bp.route('/current', methods=['GET'])
def get_current_environment():
    """현재 환경 데이터 조회 - 프론트엔드 environmentData 대응"""
    try:
        # 최신 환경 데이터 조회
        latest_data = EnvironmentData.query.order_by(
            EnvironmentData.timestamp.desc()
        ).first()
        
        if not latest_data:
            # 데이터가 없으면 시뮬레이션 데이터 생성
            simulated_data = _generate_simulation_data()
            return jsonify({
                'status': 'success',
                'message': '시뮬레이션 환경 데이터',
                'data': simulated_data
            }), 200
        
        return jsonify({
            'status': 'success',
            'message': '현재 환경 데이터 조회 완료',
            'data': latest_data.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'환경 데이터 조회 실패: {str(e)}'
        }), 500

@environment_bp.route('/history', methods=['GET'])
def get_environment_history():
    """환경 데이터 이력 조회"""
    try:
        # 쿼리 파라미터 파싱
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 100, type=int)
        
        query = EnvironmentData.query
        
        # 날짜 필터링
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(EnvironmentData.timestamp >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(EnvironmentData.timestamp <= end_dt)
        
        # 최신 순으로 정렬하고 제한
        data_list = query.order_by(
            EnvironmentData.timestamp.desc()
        ).limit(limit).all()
        
        # 데이터가 없으면 시뮬레이션 데이터 생성
        if not data_list:
            history_data = _generate_history_simulation(limit)
            return jsonify({
                'status': 'success',
                'message': '시뮬레이션 환경 데이터 이력',
                'data': {
                    'history': history_data,
                    'total_count': len(history_data)
                }
            }), 200
        
        # 데이터 변환
        history = []
        for data in data_list:
            history.append(data.to_dict())
        
        return jsonify({
            'status': 'success',
            'message': '환경 데이터 이력 조회 완료',
            'data': {
                'history': history,
                'total_count': len(history)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'환경 데이터 이력 조회 실패: {str(e)}'
        }), 500

@environment_bp.route('/datetime', methods=['GET'])
def get_environment_by_datetime():
    """특정 날짜/시간 환경 데이터 조회 - 프론트엔드 getEnvironmentDataForDateTime 대응"""
    try:
        date_str = request.args.get('date')
        time_str = request.args.get('time')
        
        if not date_str or not time_str:
            return jsonify({
                'status': 'error',
                'message': '날짜와 시간 파라미터가 필요합니다'
            }), 400
        
        # 날짜/시간 파싱
        target_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        
        # 해당 시간 전후 30분 범위에서 데이터 검색
        start_time = target_datetime - timedelta(minutes=30)
        end_time = target_datetime + timedelta(minutes=30)
        
        data = EnvironmentData.query.filter(
            EnvironmentData.timestamp.between(start_time, end_time)
        ).order_by(
            EnvironmentData.timestamp.desc()
        ).first()
        
        if not data:
            # 데이터가 없으면 해당 시간에 맞는 시뮬레이션 데이터 생성
            simulated_data = _generate_simulation_data(target_datetime)
            return jsonify({
                'status': 'success',
                'message': '시뮬레이션 환경 데이터',
                'data': simulated_data
            }), 200
        
        return jsonify({
            'status': 'success',
            'message': '환경 데이터 조회 완료',
            'data': data.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'환경 데이터 조회 실패: {str(e)}'
        }), 500

@environment_bp.route('/save', methods=['POST'])
def save_environment_data():
    """환경 데이터 저장"""
    try:
        data = request.get_json()
        
        # 필수 필드 검증
        required_fields = [
            'innerTemperature', 'outerTemperature', 'rootZoneTemperature',
            'innerHumidity', 'solarRadiation', 'ph', 'ec', 'dissolvedOxygen'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'필수 필드 누락: {field}'
                }), 400
        
        # 환경 데이터 생성
        env_data = EnvironmentData(
            inner_temperature=float(data['innerTemperature']),
            outer_temperature=float(data['outerTemperature']),
            root_zone_temperature=float(data['rootZoneTemperature']),
            inner_humidity=float(data['innerHumidity']),
            solar_radiation=float(data['solarRadiation']),
            ph=float(data['ph']),
            ec=float(data['ec']),
            dissolved_oxygen=float(data['dissolvedOxygen']),
            farm_id=data.get('farmId'),
            sensor_id=data.get('sensorId')
        )
        
        db.session.add(env_data)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '환경 데이터 저장 완료',
            'data': env_data.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'환경 데이터 저장 실패: {str(e)}'
        }), 500

@environment_bp.route('/analysis', methods=['GET'])
def analyze_environment():
    """환경 데이터 분석"""
    try:
        # 최근 24시간 데이터 조회
        since = datetime.now() - timedelta(hours=24)
        data_list = EnvironmentData.query.filter(
            EnvironmentData.timestamp >= since
        ).order_by(EnvironmentData.timestamp.desc()).all()
        
        if not data_list:
            return jsonify({
                'status': 'success',
                'message': '분석할 데이터가 없습니다',
                'data': {
                    'status': '데이터없음',
                    'recommendations': ['센서 연결을 확인하세요']
                }
            }), 200
        
        # 평균값 계산
        avg_data = {
            'inner_temp': sum(d.inner_temperature for d in data_list) / len(data_list),
            'outer_temp': sum(d.outer_temperature for d in data_list) / len(data_list),
            'humidity': sum(d.inner_humidity for d in data_list) / len(data_list),
            'ph': sum(d.ph for d in data_list) / len(data_list),
            'ec': sum(d.ec for d in data_list) / len(data_list)
        }
        
        # 환경 상태 분석
        status = '적정'
        recommendations = []
        
        # 온도 분석
        if avg_data['inner_temp'] < 18 or avg_data['inner_temp'] > 30:
            status = '주의'
            recommendations.append('온도 조절이 필요합니다')
        
        # 습도 분석
        if avg_data['humidity'] < 60 or avg_data['humidity'] > 85:
            status = '주의'
            recommendations.append('습도 조절이 필요합니다')
        
        # pH 분석
        if avg_data['ph'] < 5.5 or avg_data['ph'] > 6.5:
            status = '주의'
            recommendations.append('pH 조정이 필요합니다')
        
        # EC 분석
        if avg_data['ec'] < 1.2 or avg_data['ec'] > 2.0:
            status = '주의'
            recommendations.append('EC 조정이 필요합니다')
        
        if not recommendations:
            recommendations.append('현재 환경 상태가 양호합니다')
        
        return jsonify({
            'status': 'success',
            'message': '환경 데이터 분석 완료',
            'data': {
                'analysis_period': '24시간',
                'data_count': len(data_list),
                'average_values': avg_data,
                'environment_status': status,
                'recommendations': recommendations,
                'analysis_timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'환경 데이터 분석 실패: {str(e)}'
        }), 500

def _generate_simulation_data(target_time=None):
    """시뮬레이션 환경 데이터 생성"""
    if target_time is None:
        target_time = datetime.now()
    
    # 시간대별 변화 시뮬레이션
    hour = target_time.hour
    
    # 낮/밤 온도 변화
    temp_variation = 5 * (1 + 0.5 * random.random()) if 6 <= hour <= 18 else 0
    
    return {
        'innerTemperature': round(22 + temp_variation + random.uniform(-2, 2), 1),
        'outerTemperature': round(20 + temp_variation + random.uniform(-3, 3), 1),
        'rootZoneTemperature': round(21 + temp_variation * 0.5 + random.uniform(-1, 1), 1),
        'innerHumidity': round(70 + random.uniform(-10, 10), 1),
        'solarRadiation': round(400 + 300 * (1 if 6 <= hour <= 18 else 0) + random.uniform(-50, 50), 0),
        'ph': round(6.0 + random.uniform(-0.3, 0.3), 1),
        'ec': round(1.6 + random.uniform(-0.2, 0.2), 1),
        'dissolvedOxygen': round(8.0 + random.uniform(-1, 1), 1),
        'timestamp': target_time.isoformat()
    }

def _generate_history_simulation(count=100):
    """환경 데이터 이력 시뮬레이션 생성"""
    history = []
    now = datetime.now()
    
    for i in range(count):
        time_offset = timedelta(hours=i * 0.5)  # 30분 간격
        target_time = now - time_offset
        data = _generate_simulation_data(target_time)
        history.append(data)
    
    return history 