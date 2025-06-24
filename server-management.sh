#!/bin/bash

# 스마트팜 서버 관리 스크립트 V11.4
# Federated Learning Integration 시스템

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
print_logo() {
    echo -e "${GREEN}"
    echo "=================================================="
    echo "🌱 스마트팜 작물 성장 분석 시스템 V11.4"
    echo "   Federated Learning Integration"
    echo "=================================================="
    echo -e "${NC}"
}

# 도움말 출력
print_help() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  deploy          - 프로덕션 환경에 배포"
    echo "  dev             - 개발 환경 시작"
    echo "  stop            - 모든 서비스 중지"
    echo "  restart         - 모든 서비스 재시작"
    echo "  logs [service]  - 로그 확인 (service: frontend, backend, nginx, all)"
    echo "  status          - 서비스 상태 확인"
    echo "  update          - 시스템 업데이트"
    echo "  backup          - 데이터 백업"
    echo "  restore [file]  - 데이터 복원"
    echo "  monitor         - 모니터링 대시보드 시작"
    echo "  cleanup         - 불필요한 Docker 리소스 정리"
    echo "  ssl             - SSL 인증서 갱신"
    echo "  health          - 헬스체크 실행"
    echo "  scale [service] [count] - 서비스 스케일링"
    echo "  help            - 이 도움말 출력"
}

# 환경 체크
check_environment() {
    echo -e "${BLUE}📋 환경 체크 중...${NC}"
    
    # Docker 체크
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
        exit 1
    fi
    
    # Docker Compose 체크
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose가 설치되지 않았습니다.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 환경 체크 완료${NC}"
}

# 프로덕션 배포
deploy_production() {
    print_logo
    echo -e "${BLUE}🚀 프로덕션 환경 배포 시작...${NC}"
    
    check_environment
    
    # 환경 변수 체크
    if [ ! -f .env.production ]; then
        echo -e "${YELLOW}⚠️ .env.production 파일을 생성합니다...${NC}"
        create_env_files
    fi
    
    # 백업 생성
    echo -e "${BLUE}💾 현재 데이터 백업 중...${NC}"
    backup_data
    
    # 빌드 및 배포
    echo -e "${BLUE}🐳 Docker 이미지 빌드 중...${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    echo -e "${BLUE}🔄 서비스 배포 중...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    
    # 헬스체크
    health_check
    
    echo -e "${GREEN}🎉 프로덕션 배포 완료!${NC}"
    show_service_info
}

# 개발 환경 시작
start_development() {
    print_logo
    echo -e "${BLUE}🛠️ 개발 환경 시작...${NC}"
    
    check_environment
    
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
    
    echo -e "${GREEN}✅ 개발 환경 시작 완료!${NC}"
    show_service_info
}

# 서비스 중지
stop_services() {
    echo -e "${YELLOW}🛑 서비스 중지 중...${NC}"
    docker-compose down --remove-orphans
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    echo -e "${GREEN}✅ 서비스 중지 완료${NC}"
}

# 서비스 재시작
restart_services() {
    echo -e "${BLUE}🔄 서비스 재시작 중...${NC}"
    stop_services
    sleep 3
    deploy_production
}

# 로그 확인
show_logs() {
    local service=${1:-all}
    
    case $service in
        "frontend"|"backend"|"nginx"|"redis"|"prometheus"|"grafana")
            echo -e "${BLUE}📋 $service 로그:${NC}"
            docker-compose logs -f --tail=100 $service
            ;;
        "all"|*)
            echo -e "${BLUE}📋 모든 서비스 로그:${NC}"
            docker-compose logs -f --tail=50
            ;;
    esac
}

# 서비스 상태 확인
check_status() {
    echo -e "${BLUE}📊 서비스 상태:${NC}"
    docker-compose ps
    
    echo -e "\n${BLUE}🔍 리소스 사용량:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# 헬스체크
health_check() {
    echo -e "${BLUE}🔍 헬스체크 실행 중...${NC}"
    
    local success=true
    
    # 백엔드 체크
    if curl -f -s http://localhost:5000/api/v1/health > /dev/null; then
        echo -e "${GREEN}✅ 백엔드 서비스 정상${NC}"
    else
        echo -e "${RED}❌ 백엔드 서비스 오류${NC}"
        success=false
    fi
    
    # 프론트엔드 체크
    if curl -f -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ 프론트엔드 서비스 정상${NC}"
    else
        echo -e "${RED}❌ 프론트엔드 서비스 오류${NC}"
        success=false
    fi
    
    # Nginx 체크
    if curl -f -s http://localhost/health > /dev/null; then
        echo -e "${GREEN}✅ Nginx 서비스 정상${NC}"
    else
        echo -e "${YELLOW}⚠️ Nginx 서비스 확인 필요${NC}"
    fi
    
    if [ "$success" = true ]; then
        echo -e "${GREEN}🎉 모든 핵심 서비스가 정상적으로 작동 중입니다!${NC}"
    else
        echo -e "${RED}⚠️ 일부 서비스에 문제가 있습니다. 로그를 확인해주세요.${NC}"
    fi
}

# 서비스 정보 출력
show_service_info() {
    echo -e "\n${GREEN}📊 서비스 접속 정보:${NC}"
    echo "   • 프론트엔드: http://localhost:3000"
    echo "   • 백엔드 API: http://localhost:5000"
    echo "   • Nginx 프록시: http://localhost:80"
    echo "   • 모니터링 (Grafana): http://localhost:3001"
    echo "   • 메트릭 (Prometheus): http://localhost:9090"
    echo ""
    echo -e "${BLUE}🔧 관리 명령어:${NC}"
    echo "   • 로그 확인: $0 logs [service]"
    echo "   • 서비스 상태: $0 status"
    echo "   • 헬스체크: $0 health"
    echo "   • 서비스 중지: $0 stop"
}

# 환경 파일 생성
create_env_files() {
    # 프로덕션 환경 변수
    cat > .env.production << EOL
# 프로덕션 환경 설정
NODE_ENV=production
FLASK_ENV=production
SECRET_KEY=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_VERSION=V11.4

# 보안 설정
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true

# 데이터베이스 (필요시)
# DATABASE_URL=postgresql://user:password@db:5432/smartfarm

# AI 설정
AI_MODEL_VERSION=v2.0
AI_ACCURACY_THRESHOLD=0.85
MAX_UPLOAD_SIZE=16777216

# 성능 설정
WORKERS=4
TIMEOUT=300
KEEPALIVE=2
EOL

    echo -e "${GREEN}✅ 환경 파일 생성 완료${NC}"
}

# 데이터 백업
backup_data() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/$timestamp"
    
    mkdir -p "$backup_dir"
    
    echo -e "${BLUE}💾 데이터 백업 중... ($backup_dir)${NC}"
    
    # 업로드 파일 백업
    if [ -d "backend/uploads" ]; then
        cp -r backend/uploads "$backup_dir/"
    fi
    
    # 모델 파일 백업
    if [ -d "backend/models" ]; then
        cp -r backend/models "$backup_dir/"
    fi
    
    # 로그 백업
    if [ -d "backend/logs" ]; then
        cp -r backend/logs "$backup_dir/"
    fi
    
    # 설정 파일 백업
    cp -r *.yml *.yaml *.conf 2>/dev/null "$backup_dir/" || true
    
    echo -e "${GREEN}✅ 백업 완료: $backup_dir${NC}"
}

# 시스템 정리
cleanup_system() {
    echo -e "${YELLOW}🧹 시스템 정리 중...${NC}"
    
    # 중지된 컨테이너 제거
    docker container prune -f
    
    # 사용하지 않는 이미지 제거
    docker image prune -f
    
    # 사용하지 않는 볼륨 제거
    docker volume prune -f
    
    # 사용하지 않는 네트워크 제거
    docker network prune -f
    
    echo -e "${GREEN}✅ 시스템 정리 완료${NC}"
}

# 모니터링 시작
start_monitoring() {
    echo -e "${BLUE}📊 모니터링 시스템 시작...${NC}"
    docker-compose -f docker-compose.prod.yml up -d prometheus grafana
    
    echo -e "${GREEN}✅ 모니터링 시스템 시작 완료${NC}"
    echo "   • Grafana: http://localhost:3001 (admin/admin123)"
    echo "   • Prometheus: http://localhost:9090"
}

# 메인 로직
case ${1:-help} in
    "deploy")
        deploy_production
        ;;
    "dev")
        start_development
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs $2
        ;;
    "status")
        check_status
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_data
        ;;
    "cleanup")
        cleanup_system
        ;;
    "monitor")
        start_monitoring
        ;;
    "help"|*)
        print_logo
        print_help
        ;;
esac 