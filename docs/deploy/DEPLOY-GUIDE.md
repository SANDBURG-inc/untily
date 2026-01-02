# Untily 배포 가이드

> **문서 버전**: v1.1.0 | 2024.12.22
> **배포 방식**: Nginx + PM2 + EC2 수동 배포 (Docker, CI/CD 미적용)

AWS EC2 t2.xlarge 인스턴스에서 PM2를 사용한 Next.js 배포 가이드입니다.

## 인프라 사양

| 항목 | 사양 |
|------|------|
| 인스턴스 타입 | t2.xlarge |
| vCPU | 4 |
| 메모리 | 16GB |
| 네트워크 | Moderate |
| Node.js | 24.x (LTS) |
| 패키지 매니저 | pnpm |

---

## 파일 구조

```
/
├── .nvmrc                 # Node.js 버전 고정
├── ecosystem.config.js    # PM2 설정 파일
├── deploy.sh              # 배포 자동화 스크립트
└── logs/                  # PM2 로그 디렉토리
    ├── pm2-out.log
    └── pm2-error.log
```

---

## 최초 서버 설정

### 1. 필수 패키지 설치

```bash
# Node.js (nvm 사용 권장)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 24

# pnpm 설치
npm install -g pnpm

# PM2 설치
npm install -g pm2

# PM2 시스템 시작 설정 (서버 재부팅 시 자동 실행)
pm2 startup
```

### 2. 환경 변수 설정

서버에 `.env.production` 파일을 생성합니다.

```bash
# /path/to/untily/.env.production
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_STACK_PROJECT_ID="..."
STACK_SECRET_SERVER_KEY="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-northeast-2"
S3_BUCKET_NAME="..."
RESEND_API_KEY="..."
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

> **보안 주의**: `.env` 파일은 절대 Git에 커밋하지 마세요.

### 3. 프로젝트 클론

```bash
cd /home/ubuntu
git clone https://github.com/your-org/untily.git
cd untily
```

---

## 배포 방법

### 자동 배포 (권장)

```bash
# main 브랜치 배포 (캐시 삭제, 기본)
./deploy.sh

# 특정 브랜치 배포 (캐시 삭제, 기본)
./deploy.sh dashboard

# 빠른 배포 (캐시 유지, 빌드 속도 향상)
./deploy.sh dashboard --fast
```

| 옵션 | 설명 | 빌드 시간 |
|------|------|-----------|
| (기본) | `.next` 캐시 삭제 후 빌드 | ~30초 |
| `--fast` | 캐시 유지하고 빌드 | ~20초 |

> **권장**: 일반적으로 기본(캐시 삭제)을 사용하세요. 캐시 문제로 인한 예상치 못한 버그를 방지합니다.


### 수동 배포

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 의존성 설치
pnpm install --frozen-lockfile

# 3. Prisma 클라이언트 생성
npx prisma generate

# 4. 빌드
pnpm build

# 5. PM2 시작/재시작
pm2 start ecosystem.config.js --env production  # 최초 실행
pm2 reload ecosystem.config.js --env production # 무중단 재시작
pm2 save  # 설정 저장
```

---

## PM2 명령어

### 기본 명령어

```bash
pm2 status              # 프로세스 상태 확인
pm2 logs untily         # 실시간 로그 확인
pm2 logs untily --lines 100  # 최근 100줄 로그
pm2 monit               # 리소스 모니터링 (CPU, 메모리)
```

### pm2 status 출력 컬럼 설명

```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

| 컬럼 | 설명 |
|------|------|
| `id` | 프로세스 고유 ID |
| `name` | 앱 이름 (ecosystem.config.js에서 정의) |
| `mode` | 실행 모드 (`fork` 또는 `cluster`) |
| `↺` | **재시작 횟수** - 높으면 앱 불안정 또는 메모리 초과 의심 |
| `status` | 상태 (`online`, `stopped`, `errored`) |
| `cpu` | CPU 사용률 |
| `memory` | 메모리 사용량 |

### 프로세스 관리

```bash
pm2 reload untily       # 무중단 재시작 (권장)
pm2 restart untily      # 강제 재시작
pm2 stop untily         # 중지
pm2 delete untily       # 삭제
```

### 클러스터 관리

```bash
pm2 scale untily 4      # 인스턴스 수 조정
pm2 scale untily +2     # 2개 추가
pm2 scale untily -2     # 2개 감소
```

### 프로세스 정리

기존 프로세스가 남아있거나 이름이 변경된 경우:

```bash
# 특정 프로세스 삭제
pm2 delete next-app     # 기존 next-app 프로세스 삭제

# 모든 프로세스 삭제 (주의)
pm2 delete all

# 삭제 후 설정 저장 (재부팅 시 삭제된 프로세스 안 뜨게)
pm2 save

# 저장된 프로세스 목록 초기화
pm2 cleardump
```

### PM2 완전 초기화

문제가 지속되면 PM2를 완전히 초기화:

```bash
pm2 kill                # 모든 PM2 프로세스 종료
pm2 cleardump           # 저장된 설정 삭제
pm2 start ecosystem.config.js --env production  # 새로 시작
pm2 save                # 설정 저장
```

---

## ecosystem.config.js 설명

```javascript
module.exports = {
  apps: [{
    name: 'untily',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',

    // 클러스터 모드: t2.xlarge 4 vCPU에 맞춰 4개 인스턴스
    instances: 4,
    exec_mode: 'cluster',

    // 무중단 배포
    wait_ready: true,        // 앱이 ready 신호를 보낼 때까지 대기
    listen_timeout: 10000,   // ready 대기 시간 (10초)
    kill_timeout: 5000,      // 종료 대기 시간 (5초)

    // 메모리 관리
    max_memory_restart: '1G', // 1GB 초과 시 자동 재시작
  }]
};
```

### 주요 설정 항목

| 설정 | 값 | 설명 |
|------|-----|------|
| `instances` | 4 | vCPU 수에 맞춘 프로세스 수 |
| `exec_mode` | cluster | 클러스터 모드 (로드 밸런싱) |
| `wait_ready` | true | 무중단 배포 활성화 |
| `max_memory_restart` | 1G | 메모리 누수 방지 |

---

## 배포 스크립트 (deploy.sh) 설명

스크립트 실행 순서:

1. **로그 디렉토리 생성** - `logs/` 폴더 확인
2. **Node.js 버전 확인** - `.nvmrc` 파일 기준으로 버전 맞춤
3. **환경 변수 확인** - `.env` 파일 존재 여부 검증
4. **Git pull** - 최신 코드 가져오기
5. **의존성 설치** - `pnpm install --frozen-lockfile`
6. **Prisma generate** - DB 클라이언트 생성
7. **빌드** - `pnpm build`
8. **PM2 reload** - 무중단 배포
9. **헬스체크** - HTTP 200 응답 확인

---

## 트러블슈팅

### 빌드 실패

```bash
# 로그 확인
cat logs/pm2-error.log

# 메모리 부족 시 swap 추가
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### PM2 프로세스가 계속 재시작됨

```bash
# 에러 로그 확인
pm2 logs untily --err --lines 50

# 메모리 사용량 확인
pm2 monit
```

### 포트 3000이 이미 사용 중

```bash
# 포트 사용 프로세스 확인
lsof -i :3000

# 강제 종료
kill -9 $(lsof -t -i:3000)
```

### 환경 변수가 적용되지 않음

Next.js는 빌드 시점에 환경 변수가 주입됩니다.

```bash
# 환경 변수 변경 후 반드시 재빌드
pnpm build
pm2 reload ecosystem.config.js --env production
```

---

## 모니터링

### PM2 대시보드

```bash
pm2 monit
```

### 로그 로테이션 설정

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 디스크 사용량 확인

```bash
df -h
du -sh .next/
du -sh node_modules/
```

---

## 보안 체크리스트

- [x] `.env` 파일 권한 설정 (`chmod 600 .env`)
- [x] 방화벽에서 3000 포트 차단 (Nginx 프록시 사용)
- [x] SSH 키 기반 인증만 허용
- [ ] 정기적인 보안 업데이트 (`sudo apt update && sudo apt upgrade`)

> 보안 설정 상세 내용은 [SECURITY.md](./SECURITY.md) 참고

---

## Nginx 리버스 프록시

현재 Nginx + Let's Encrypt SSL로 구성되어 있습니다.

### 현재 구성

```
인터넷 → Nginx (443/HTTPS) → Next.js (127.0.0.1:3000)
              └─ SSL: Let's Encrypt (자동 갱신)
```

### 설정 파일 위치

```bash
/etc/nginx/sites-enabled/default  # Nginx 설정
/etc/letsencrypt/live/dev.untily.kr/  # SSL 인증서
```

### 주요 설정 내용

```nginx
server {
    server_name dev.untily.kr;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/dev.untily.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.untily.kr/privkey.pem;
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name dev.untily.kr;
    return 301 https://$host$request_uri;
}
```

### Nginx 명령어

```bash
sudo nginx -t              # 설정 문법 검사
sudo systemctl reload nginx  # 설정 적용 (무중단)
sudo systemctl status nginx  # 상태 확인
```

### SSL 인증서 확인

```bash
# 인증서 만료일 확인
sudo certbot certificates

# 인증서 갱신 테스트
sudo certbot renew --dry-run
```

---

## 관련 문서

- [PM2 공식 문서](https://pm2.keymetrics.io/docs/)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [AWS EC2 사용 가이드](https://docs.aws.amazon.com/ec2/)
