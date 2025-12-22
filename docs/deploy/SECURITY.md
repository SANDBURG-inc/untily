# 서버 보안 설정 가이드

> **작성일**: 2024.12.22
> **적용 환경**: AWS EC2 (Ubuntu)

## 현재 보안 상태

| 항목 | 상태 | 적용일 |
|------|------|--------|
| SSH 비밀번호 인증 비활성화 | ✅ 완료 | 2024.12.22 |
| 3000 포트 외부 차단 | ✅ 완료 | 2024.12.22 |
| .env 파일 권한 제한 | ✅ 완료 | 2024.12.17 |
| HTTPS (SSL/TLS) | ✅ 완료 | 기존 설정 |
| HTTP → HTTPS 리다이렉트 | ✅ 완료 | 기존 설정 |

---

## 1. SSH 비밀번호 인증 비활성화

### 어떤 공격을 막는가?

**무차별 대입 공격 (Brute Force Attack)**

공격자가 자동화 스크립트로 수천~수백만 개의 비밀번호를 시도하여 SSH 접속을 뚫는 공격입니다.

```
# 공격 예시 (실제 로그)
Failed password for ubuntu from 185.xxx.xxx.xxx port 22 ssh2
Failed password for ubuntu from 185.xxx.xxx.xxx port 22 ssh2
Failed password for ubuntu from 185.xxx.xxx.xxx port 22 ssh2
... (수천 번 반복)
```

### 원래 상태

```bash
PasswordAuthentication yes  # 비밀번호 인증 허용 (위험)
```

- 누구나 `ssh ubuntu@IP`로 비밀번호 입력 시도 가능
- 단순한 비밀번호는 몇 시간 내 뚫릴 수 있음

### 현재 상태

```bash
# /etc/ssh/sshd_config
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
```

- PEM 키 파일 없이는 SSH 접속 불가능
- 키 파일은 2048/4096비트 암호화 (사실상 해킹 불가)

### 확인 방법

```bash
# 설정 확인
grep "^PasswordAuthentication" /etc/ssh/sshd_config
# 출력: PasswordAuthentication no

# 비밀번호 접속 시도 (다른 PC에서)
ssh ubuntu@[EC2-IP]
# 출력: Permission denied (publickey).
```

### 접속 방법

| 방식 | 가능 여부 |
|------|-----------|
| 터미널 + PEM 키 | ✅ `ssh -i key.pem ubuntu@ip` |
| EC2 Instance Connect | ✅ AWS 콘솔에서 접속 |
| 터미널 + 비밀번호 | ❌ 차단됨 |

---

## 2. 3000 포트 외부 차단

### 어떤 공격을 막는가?

**직접 애플리케이션 공격**

Next.js가 3000 포트에서 직접 노출되면:
- DDoS 공격에 취약
- 애플리케이션 취약점 직접 공격 가능
- SSL 없이 평문 통신 노출

### 원래 상태

```
AWS Security Group:
- 22 (SSH): 0.0.0.0/0
- 80 (HTTP): 0.0.0.0/0
- 443 (HTTPS): 0.0.0.0/0
- 3000: 0.0.0.0/0  ← 누구나 직접 접근 가능 (위험)
```

```
인터넷 → EC2:3000 (Next.js 직접 노출)
```

### 현재 상태

```
AWS Security Group:
- 22 (SSH): 0.0.0.0/0
- 80 (HTTP): 0.0.0.0/0
- 443 (HTTPS): 0.0.0.0/0
- 3000: 삭제됨 ✅
```

```
인터넷 → Nginx (443) → localhost:3000 (내부만 접근)
```

### 효과

| 항목 | 설명 |
|------|------|
| SSL 적용 | 모든 트래픽 암호화 (HTTPS) |
| 직접 접근 차단 | 3000 포트로 외부 접근 불가 |
| Nginx 보호 | 악성 요청 필터링, 로드밸런싱 가능 |

### 확인 방법

```bash
# 외부에서 3000 포트 접근 시도
curl -I http://[EC2-PUBLIC-IP]:3000
# 출력: Connection refused (정상)

# HTTPS로만 접근 가능
curl -I https://dev.untily.kr
# 출력: HTTP/2 200 (정상)
```

---

## 3. .env 파일 권한 제한

### 어떤 공격을 막는가?

**권한 상승 공격 (Privilege Escalation)**

같은 서버의 다른 사용자나 침입자가 환경 변수 파일을 읽어 DB 비밀번호, API 키를 탈취하는 공격입니다.

### 원래 상태

```bash
-rw-r--r-- (644)  # 모든 사용자가 읽기 가능 (위험)
```

### 현재 상태

```bash
-rw------- (600)  # 소유자(ubuntu)만 읽기/쓰기 가능
```

### 확인 방법

```bash
ls -la ~/untily/.env*
# 출력: -rw------- 1 ubuntu ubuntu ... .env
```

### 설정 방법

```bash
chmod 600 .env
chmod 600 .env.local
chmod 600 .env.production
```

---

## 보안 확인 스크립트

EC2에서 한 번에 보안 상태를 확인하는 스크립트:

```bash
#!/bin/bash
echo "=== 보안 상태 확인 ==="

echo -e "\n[1] SSH 비밀번호 인증"
grep "^PasswordAuthentication" /etc/ssh/sshd_config || echo "기본값 (yes일 수 있음)"

echo -e "\n[2] .env 파일 권한"
ls -la ~/untily/.env* 2>/dev/null || echo ".env 파일 없음"

echo -e "\n[3] UFW 방화벽 상태"
sudo ufw status | head -10

echo -e "\n[4] 열린 포트 (LISTEN)"
sudo ss -tlnp | grep LISTEN

echo -e "\n[5] SSL 인증서 만료일"
sudo certbot certificates 2>/dev/null | grep "Expiry" || echo "certbot 없음"
```

---

## 추가 권장 사항

### 아직 적용하지 않은 항목

| 항목 | 우선순위 | 설명 |
|------|----------|------|
| SSH 포트 변경 | 선택 | 22 → 다른 포트 (봇 공격 감소) |
| Fail2ban 설치 | 권장 | SSH 무차별 공격 자동 차단 |
| 정기 보안 업데이트 | 필수 | `sudo apt update && sudo apt upgrade` |

### Fail2ban 설치 (권장)

SSH 로그인 실패가 반복되면 해당 IP를 자동 차단합니다.

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 상태 확인
sudo fail2ban-client status sshd
```

---

## 관련 문서

- [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md) - 배포 가이드
- [AWS Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [Let's Encrypt](https://letsencrypt.org/docs/)
