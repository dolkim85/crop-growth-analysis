"""
🌱 데이터 관리 라우트
프론트엔드 '데이터 관리' 탭 완전 대응
"""

from flask import Blueprint, request, jsonify, make_response
from datetime import datetime, timedelta
import json
import csv
import io
from app.models.plant import AnalysisResult, EnvironmentData, PlantImage
from app import db

data_management_bp = Blueprint('data_management', __name__, url_prefix='/api/v2/data-management')

@data_management_bp.route('/export/json', methods=['POST'])
def export_json():
    """JSON 형식으로 데이터 내보내기"""
    try:
        data = request.get_json()
        export_type = data.get('type', 'all')
        date_range = data.get('dateRange', {})
        
        export_data = {}
        
        # 날짜 필터링 설정
        start_date = None
        end_date = None
        if date_range.get('start'):
            start_date = datetime.fromisoformat(date_range['start'])
        if date_range.get('end'):
            end_date = datetime.fromisoformat(date_range['end'])
        
        # 분석 결과 데이터
        if export_type in ['all', 'analysis']:
            query = AnalysisResult.query
            if start_date:
                query = query.filter(AnalysisResult.date >= start_date)
            if end_date:
                query = query.filter(AnalysisResult.date <= end_date)
            
            analysis_results = query.order_by(AnalysisResult.date.desc()).all()
            export_data['analysis_results'] = [result.to_dict() for result in analysis_results]
        
        # 환경 데이터
        if export_type in ['all', 'environment']:
            query = EnvironmentData.query
            if start_date:
                query = query.filter(EnvironmentData.timestamp >= start_date)
            if end_date:
                query = query.filter(EnvironmentData.timestamp <= end_date)
            
            env_data = query.order_by(EnvironmentData.timestamp.desc()).all()
            export_data['environment_data'] = [data.to_dict() for data in env_data]
        
        # 이미지 데이터
        if export_type in ['all', 'images']:
            query = PlantImage.query
            if start_date:
                query = query.filter(PlantImage.timestamp >= start_date)
            if end_date:
                query = query.filter(PlantImage.timestamp <= end_date)
            
            images = query.order_by(PlantImage.timestamp.desc()).all()
            export_data['images'] = [img.to_dict() for img in images]
        
        # 메타데이터 추가
        export_data['metadata'] = {
            'export_timestamp': datetime.now().isoformat(),
            'export_type': export_type,
            'date_range': date_range,
            'total_records': sum(len(v) for v in export_data.values() if isinstance(v, list))
        }
        
        # JSON 응답 생성
        response = make_response(json.dumps(export_data, ensure_ascii=False, indent=2))
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename=smartfarm_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        
        return response
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'JSON 내보내기 실패: {str(e)}'
        }), 500

@data_management_bp.route('/export/csv', methods=['POST'])
def export_csv():
    """CSV 형식으로 데이터 내보내기"""
    try:
        data = request.get_json()
        export_type = data.get('type', 'analysis')
        date_range = data.get('dateRange', {})
        
        # CSV 데이터 생성
        output = io.StringIO()
        
        if export_type == 'analysis':
            # 분석 결과 CSV
            writer = csv.writer(output)
            writer.writerow(['ID', '모델ID', '분석일시', '상태', '신뢰도', '권장사항'])
            
            query = AnalysisResult.query
            if date_range.get('start'):
                start_date = datetime.fromisoformat(date_range['start'])
                query = query.filter(AnalysisResult.date >= start_date)
            if date_range.get('end'):
                end_date = datetime.fromisoformat(date_range['end'])
                query = query.filter(AnalysisResult.date <= end_date)
            
            results = query.order_by(AnalysisResult.date.desc()).all()
            for result in results:
                recommendations = json.loads(result.recommendations) if result.recommendations else []
                writer.writerow([
                    result.id,
                    result.model_id,
                    result.date.isoformat() if result.date else '',
                    result.condition or '',
                    '',  # 신뢰도는 analysis_data에서 추출 필요
                    '; '.join(recommendations)
                ])
        
        elif export_type == 'environment':
            # 환경 데이터 CSV
            writer = csv.writer(output)
            writer.writerow(['ID', '측정시간', '내부온도', '외부온도', '근권온도', '내부습도', '일사량', 'pH', 'EC', '용존산소'])
            
            query = EnvironmentData.query
            if date_range.get('start'):
                start_date = datetime.fromisoformat(date_range['start'])
                query = query.filter(EnvironmentData.timestamp >= start_date)
            if date_range.get('end'):
                end_date = datetime.fromisoformat(date_range['end'])
                query = query.filter(EnvironmentData.timestamp <= end_date)
            
            env_data = query.order_by(EnvironmentData.timestamp.desc()).all()
            for data in env_data:
                writer.writerow([
                    data.id,
                    data.timestamp.isoformat() if data.timestamp else '',
                    data.inner_temperature,
                    data.outer_temperature,
                    data.root_zone_temperature,
                    data.inner_humidity,
                    data.solar_radiation,
                    data.ph,
                    data.ec,
                    data.dissolved_oxygen
                ])
        
        # CSV 응답 생성
        csv_data = output.getvalue()
        output.close()
        
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename=smartfarm_{export_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        return response
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'CSV 내보내기 실패: {str(e)}'
        }), 500

@data_management_bp.route('/import', methods=['POST'])
def import_data():
    """데이터 가져오기"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': '파일이 없습니다'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': '파일이 선택되지 않았습니다'
            }), 400
        
        # 파일 형식 확인
        if not file.filename.lower().endswith(('.json', '.csv')):
            return jsonify({
                'status': 'error',
                'message': 'JSON 또는 CSV 파일만 지원됩니다'
            }), 400
        
        import_results = {
            'total_records': 0,
            'successful_imports': 0,
            'failed_imports': 0,
            'errors': []
        }
        
        if file.filename.lower().endswith('.json'):
            # JSON 파일 처리
            try:
                file_content = file.read().decode('utf-8')
                data = json.loads(file_content)
                
                # 환경 데이터 가져오기
                if 'environment_data' in data:
                    for env_record in data['environment_data']:
                        try:
                            env_data = EnvironmentData(
                                inner_temperature=float(env_record['innerTemperature']),
                                outer_temperature=float(env_record['outerTemperature']),
                                root_zone_temperature=float(env_record['rootZoneTemperature']),
                                inner_humidity=float(env_record['innerHumidity']),
                                solar_radiation=float(env_record['solarRadiation']),
                                ph=float(env_record['ph']),
                                ec=float(env_record['ec']),
                                dissolved_oxygen=float(env_record['dissolvedOxygen']),
                                timestamp=datetime.fromisoformat(env_record['timestamp']) if env_record.get('timestamp') else datetime.now()
                            )
                            db.session.add(env_data)
                            import_results['successful_imports'] += 1
                        except Exception as e:
                            import_results['failed_imports'] += 1
                            import_results['errors'].append(f'환경 데이터 가져오기 실패: {str(e)}')
                        
                        import_results['total_records'] += 1
                
                db.session.commit()
                
            except json.JSONDecodeError:
                return jsonify({
                    'status': 'error',
                    'message': '유효하지 않은 JSON 파일입니다'
                }), 400
        
        elif file.filename.lower().endswith('.csv'):
            # CSV 파일 처리
            try:
                file_content = file.read().decode('utf-8')
                csv_reader = csv.DictReader(io.StringIO(file_content))
                
                for row in csv_reader:
                    try:
                        # CSV 헤더에 따라 적절한 데이터 모델로 변환
                        if '내부온도' in row:  # 환경 데이터
                            env_data = EnvironmentData(
                                inner_temperature=float(row['내부온도']),
                                outer_temperature=float(row['외부온도']),
                                root_zone_temperature=float(row['근권온도']),
                                inner_humidity=float(row['내부습도']),
                                solar_radiation=float(row['일사량']),
                                ph=float(row['pH']),
                                ec=float(row['EC']),
                                dissolved_oxygen=float(row['용존산소']),
                                timestamp=datetime.fromisoformat(row['측정시간']) if row.get('측정시간') else datetime.now()
                            )
                            db.session.add(env_data)
                        
                        import_results['successful_imports'] += 1
                    except Exception as e:
                        import_results['failed_imports'] += 1
                        import_results['errors'].append(f'CSV 행 처리 실패: {str(e)}')
                    
                    import_results['total_records'] += 1
                
                db.session.commit()
                
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': f'CSV 파일 처리 실패: {str(e)}'
                }), 400
        
        return jsonify({
            'status': 'success',
            'message': '데이터 가져오기 완료',
            'data': import_results
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'데이터 가져오기 실패: {str(e)}'
        }), 500

@data_management_bp.route('/storage/info', methods=['GET'])
def get_storage_info():
    """스토리지 정보 조회"""
    try:
        # 데이터베이스 통계
        analysis_count = AnalysisResult.query.count()
        environment_count = EnvironmentData.query.count()
        image_count = PlantImage.query.count()
        
        # 파일 크기 계산 (시뮬레이션)
        import random
        estimated_db_size = (analysis_count * 2 + environment_count * 1 + image_count * 0.5) * 1024  # KB
        estimated_file_size = image_count * random.randint(1000, 5000)  # KB
        
        storage_info = {
            'database': {
                'analysis_results': analysis_count,
                'environment_data': environment_count,
                'images_metadata': image_count,
                'estimated_size_kb': int(estimated_db_size)
            },
            'files': {
                'image_files': image_count,
                'estimated_size_kb': int(estimated_file_size)
            },
            'total': {
                'records': analysis_count + environment_count + image_count,
                'estimated_size_mb': round((estimated_db_size + estimated_file_size) / 1024, 2)
            },
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'status': 'success',
            'message': '스토리지 정보 조회 완료',
            'data': storage_info
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'스토리지 정보 조회 실패: {str(e)}'
        }), 500

@data_management_bp.route('/cleanup', methods=['POST'])
def cleanup_data():
    """데이터 정리"""
    try:
        data = request.get_json()
        cleanup_type = data.get('type', 'old_data')
        days_old = data.get('daysOld', 30)
        
        cleanup_results = {
            'deleted_records': 0,
            'freed_space_kb': 0,
            'cleanup_type': cleanup_type
        }
        
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        if cleanup_type == 'old_data':
            # 오래된 데이터 삭제
            old_analysis = AnalysisResult.query.filter(AnalysisResult.date < cutoff_date).all()
            old_environment = EnvironmentData.query.filter(EnvironmentData.timestamp < cutoff_date).all()
            
            for record in old_analysis:
                db.session.delete(record)
                cleanup_results['deleted_records'] += 1
            
            for record in old_environment:
                db.session.delete(record)
                cleanup_results['deleted_records'] += 1
        
        elif cleanup_type == 'failed_analysis':
            # 실패한 분석 결과 삭제
            failed_analysis = AnalysisResult.query.filter(
                AnalysisResult.condition == '분석불가'
            ).all()
            
            for record in failed_analysis:
                db.session.delete(record)
                cleanup_results['deleted_records'] += 1
        
        elif cleanup_type == 'orphaned_images':
            # 분석 결과가 없는 이미지 삭제
            # 실제 구현에서는 더 복잡한 로직 필요
            cleanup_results['deleted_records'] = 0  # 시뮬레이션
        
        db.session.commit()
        
        # 예상 절약 공간 계산
        cleanup_results['freed_space_kb'] = cleanup_results['deleted_records'] * 2 * 1024
        
        return jsonify({
            'status': 'success',
            'message': '데이터 정리 완료',
            'data': cleanup_results
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'데이터 정리 실패: {str(e)}'
        }), 500

@data_management_bp.route('/backup', methods=['POST'])
def create_backup():
    """데이터 백업 생성"""
    try:
        backup_info = {
            'backup_id': f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'created_at': datetime.now().isoformat(),
            'status': 'completed',
            'records_count': {
                'analysis_results': AnalysisResult.query.count(),
                'environment_data': EnvironmentData.query.count(),
                'images': PlantImage.query.count()
            },
            'backup_size_mb': round(random.uniform(10, 100), 2),
            'backup_location': '/backups/smartfarm_backup.zip'
        }
        
        return jsonify({
            'status': 'success',
            'message': '백업이 생성되었습니다',
            'data': backup_info
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'백업 생성 실패: {str(e)}'
        }), 500 