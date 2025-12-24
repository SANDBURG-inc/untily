#!/bin/bash
#
# Untily 배포 스크립트
# AWS EC2 t2.xlarge 환경에서 무중단 배포를 수행합니다.
#
# 사용법: ./deploy.sh [branch] [options]
#   branch: 배포할 Git 브랜치 (기본값: main)
#   options:
#     --fast: 캐시 삭제 없이 빠른 빌드 (기본: 캐시 삭제)
#
# 예시:
#   ./deploy.sh              # main 브랜치 배포 (캐시 삭제)
#   ./deploy.sh dashboard    # dashboard 브랜치 배포 (캐시 삭제)
#   ./deploy.sh dashboard --fast  # 캐시 유지하고 빠른 배포
#

set -e  # 에러 발생 시 즉시 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 스크립트 시작
echo ""
echo "========================================"
echo "       Untily 배포 스크립트 시작"
echo "========================================"
echo ""

BRANCH=${1:-main}
FAST_MODE=false
APP_DIR=$(pwd)
LOGS_DIR="${APP_DIR}/logs"

# 옵션 파싱
for arg in "$@"; do
    case $arg in
        --fast)
            FAST_MODE=true
            ;;
    esac
done

log_info "배포 브랜치: ${BRANCH}"
log_info "애플리케이션 디렉토리: ${APP_DIR}"
if [ "$FAST_MODE" = true ]; then
    log_info "빌드 모드: Fast (캐시 유지)"
else
    log_info "빌드 모드: Clean (캐시 삭제)"
fi

# 1. 로그 디렉토리 생성
if [ ! -d "$LOGS_DIR" ]; then
    log_info "로그 디렉토리 생성 중..."
    mkdir -p "$LOGS_DIR"
fi

# 2. Node.js 버전 확인 (nvm 사용)
log_info "Node.js 버전 확인 중..."
if [ -f ".nvmrc" ]; then
    # nvm 로드
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    REQUIRED_NODE_VERSION=$(cat .nvmrc)
    CURRENT_NODE_VERSION=$(node -v | sed 's/v//')

    if [ "$CURRENT_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
        log_warning "Node.js 버전 불일치. 필요: ${REQUIRED_NODE_VERSION}, 현재: ${CURRENT_NODE_VERSION}"
        log_info "nvm으로 Node.js 버전 변경 중..."
        nvm use || nvm install
    fi
fi
log_success "Node.js $(node -v) 사용 중"

# 3. 환경 변수 파일 확인
log_info "환경 변수 파일 확인 중..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    log_error ".env 파일이 없습니다. 배포 전 환경 변수를 설정해주세요."
    log_info "필수 환경 변수:"
    log_info "  - DATABASE_URL"
    log_info "  - NEXT_PUBLIC_STACK_PROJECT_ID"
    log_info "  - STACK_SECRET_SERVER_KEY"
    log_info "  - AWS_ACCESS_KEY_ID"
    log_info "  - AWS_SECRET_ACCESS_KEY"
    log_info "  - RESEND_API_KEY"
    exit 1
fi
log_success "환경 변수 파일 확인 완료"

# 4. Git 최신 코드 가져오기
log_info "Git에서 최신 코드 가져오는 중..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
log_success "Git pull 완료"

# 5. 의존성 설치 (pnpm 사용)
log_info "의존성 설치 중..."
if command -v pnpm &> /dev/null; then
    pnpm install --frozen-lockfile
else
    log_warning "pnpm이 설치되어 있지 않습니다. npm ci를 사용합니다."
    npm ci
fi
log_success "의존성 설치 완료"

# 6. Prisma DB 스키마 동기화 및 클라이언트 생성
log_info "Prisma DB 스키마 동기화 중..."
npx prisma db push
log_success "Prisma DB 스키마 동기화 완료"

log_info "Prisma 클라이언트 생성 중..."
npx prisma generate
log_success "Prisma 클라이언트 생성 완료"

# 7. 캐시 삭제 (기본 동작)
if [ "$FAST_MODE" = false ]; then
    log_info "빌드 캐시 삭제 중..."
    rm -rf .next
    log_success "캐시 삭제 완료"
fi

# 8. 프로덕션 빌드
log_info "프로덕션 빌드 시작..."
BUILD_START=$(date +%s)

if pnpm build; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    log_success "빌드 완료 (소요 시간: ${BUILD_TIME}초)"
else
    log_error "빌드 실패. 배포를 중단합니다."
    exit 1
fi

# 9. PM2로 애플리케이션 재시작 (무중단 배포)
log_info "PM2 무중단 배포 시작..."

if pm2 list | grep -q "untily"; then
    # 기존 프로세스가 있으면 reload (무중단)
    log_info "기존 프로세스 reload 중..."
    pm2 reload ecosystem.config.js --env production
else
    # 첫 배포시 start
    log_info "새 프로세스 시작 중..."
    pm2 start ecosystem.config.js --env production
fi

# PM2 설정 저장 (서버 재시작 시 자동 실행)
pm2 save
log_success "PM2 배포 완료"

# 10. 헬스체크
log_info "헬스체크 수행 중..."
sleep 5  # PM2가 완전히 시작될 때까지 대기

HEALTH_CHECK_URL="http://localhost:3000"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")

if [ "$HTTP_STATUS" -eq "200" ]; then
    log_success "헬스체크 성공 (HTTP ${HTTP_STATUS})"
else
    log_warning "헬스체크 실패 (HTTP ${HTTP_STATUS}). 로그를 확인해주세요."
    log_info "PM2 로그: pm2 logs untily"
fi

# 11. 배포 완료 요약
echo ""
echo "========================================"
echo "          배포 완료 요약"
echo "========================================"
echo ""
log_success "배포가 완료되었습니다!"
echo ""
echo "  브랜치: ${BRANCH}"
echo "  빌드 시간: ${BUILD_TIME}초"
echo "  PM2 상태: $(pm2 list | grep untily | awk '{print $18}')"
echo ""
echo "유용한 명령어:"
echo "  pm2 status          - 프로세스 상태 확인"
echo "  pm2 logs untily     - 실시간 로그 확인"
echo "  pm2 monit           - 리소스 모니터링"
echo "  pm2 reload untily   - 무중단 재시작"
echo ""
