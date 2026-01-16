# 문서함 상태 관리 기능

> v0.2.0 기능

## 개요

문서함(DocumentBox)에 명시적인 상태(status) 필드를 추가하여 제출 가능 여부를 제어합니다.
회원 탈퇴 시 해당 회원의 문서함을 자동으로 닫아 제출을 차단합니다.

---

## Phase 1 (기본 상태 관리)

### 상태 종류

| 상태 | 설명 | 제출 가능 |
|------|------|----------|
| `OPEN` | 기본값, 정상 운영 중 | O |
| `CLOSED` | 닫힌 상태 (탈퇴, 수동) | X |

### 주요 변경 사항

#### 1. 회원 탈퇴 시 문서함 닫기

**파일**: `app/api/user/delete/route.ts`

회원 탈퇴 시 해당 회원의 모든 문서함 `status`를 `CLOSED`로 변경합니다.

---

## Phase 2 (마감 후 제출 허용 + 상태 관리 UI)

### 추가 상태

| 상태 | 설명 | 제출 가능 |
|------|------|----------|
| `OPEN_SOMEONE` | 마감 후 리마인드 수신자만 제출 가능 | O (일부) |
| `CLOSED_EXPIRED` | 마감 후 자동 닫힘 (Cron Job) | X |
| `OPEN_RESUME` | 관리자가 다시 연 상태 | O |

### 스키마 변경

```prisma
enum DocumentBoxStatus {
  OPEN            // 정상 오픈 (마감 전, 제출 가능)
  CLOSED          // 닫힌 상태 (소유자 탈퇴, 수동 닫기)
  OPEN_SOMEONE    // 마감 후 제한적 오픈 (리마인드 수신자만)
  CLOSED_EXPIRED  // 마감 후 자동 닫힘
  OPEN_RESUME     // 마감 후 관리자가 다시 열어준 상태
}

model DocumentBox {
  // ... 기존 필드
  status DocumentBoxStatus @default(OPEN)
}

model ReminderLog {
  // ... 기존 필드
  sentAfterDeadline Boolean @default(false)  // 마감 후 발송 여부
}
```

### 주요 변경 사항

#### 1. 대시보드 상태 표시 및 변경 드롭다운

**파일**: `components/dashboard/DocumentCard.tsx`, `components/dashboard/StatusChangeDropdown.tsx`

- 문서함 카드에 현재 상태 Badge 표시 및 드롭다운 메뉴
- 상태 레이블: 열림/일부열림/다시열림/닫힘/자동닫힘
- 드롭다운에서 상태 변경 가능:
  - CLOSED/CLOSED_EXPIRED → "열림으로 변경" → `OPEN_RESUME`
  - OPEN/OPEN_SOMEONE/OPEN_RESUME → "닫힘으로 변경" → `CLOSED`

#### 2. 인증 로직에서 상태 체크

**파일**: `lib/auth/public-submit-auth.ts`, `lib/auth/submitter-auth.ts`

- OPEN, OPEN_RESUME: 모든 사용자 제출 가능
- OPEN_SOMEONE: 마감 후 리마인드 수신자만 제출 가능
- CLOSED, CLOSED_EXPIRED: 제출 불가

```typescript
// OPEN_SOMEONE 상태: 리마인드 수신자만 제출 가능
if (isDocumentBoxLimitedOpen(documentBox.status)) {
  const canSubmit = await hasReceivedReminderAfterDeadline(documentBoxId, submitterId);
  if (!canSubmit) {
    return { status: 'closed', documentBox };
  }
}
```

#### 3. 리마인드 수신자 확인 함수

**파일**: `lib/queries/reminder.ts`

```typescript
// 마감 후 리마인드 수신 여부 확인
export async function hasReceivedReminderAfterDeadline(
  documentBoxId: string,
  submitterId: string
): Promise<boolean>
```

#### 4. 보내기 페이지 Dialog

**파일**: `components/dashboard/SendForm.tsx`

OPEN 상태가 아닌 문서함에서 리마인드를 발송할 때:
- 확인 Dialog 표시
- "동의하고 발송" 클릭 시 `OPEN_SOMEONE` 상태로 변경
- 리마인드 로그에 `sentAfterDeadline: true` 설정

#### 5. 문서함 수정 폼에서 "다시 열기" 기능

**파일**: `components/dashboard/document-registration/SubmissionSettingsCard.tsx`

- CLOSED / CLOSED_EXPIRED / OPEN_SOMEONE 상태에서 기한을 연장하면 Dialog 표시
- Dialog: "제출 기한을 연장하면 문서함이 다시 열림 상태로 변경됩니다."
- 확인 후 수정완료 버튼을 누르면 상태가 `OPEN`으로 변경

#### 6. 마감일 자동 상태 전환 Cron Job

**파일**: `app/api/cron/status-transition/route.ts`

- 30분마다 실행
- 마감일이 지난 `OPEN` 상태 문서함을 `CLOSED_EXPIRED`로 자동 전환
- OPEN_SOMEONE, OPEN_RESUME 상태는 특수 상태이므로 자동 전환하지 않음

### 타입 정의

**파일**: `lib/types/document.ts`

```typescript
// 문서함 상태 타입 (클라이언트에서도 사용 가능)
export type DocumentBoxStatus = 'OPEN' | 'CLOSED' | 'OPEN_SOMEONE' | 'CLOSED_EXPIRED' | 'OPEN_RESUME';

export const DOCUMENT_BOX_STATUS_LABELS: Record<DocumentBoxStatus, string>;
export const DOCUMENT_BOX_STATUS_SHORT_LABELS: Record<DocumentBoxStatus, string>;
export const DOCUMENT_BOX_STATUS_DESCRIPTIONS: Record<DocumentBoxStatus, string>;

export function isDocumentBoxOpen(status: DocumentBoxStatus): boolean;
export function isDocumentBoxLimitedOpen(status: DocumentBoxStatus): boolean;
export function isDocumentBoxClosed(status: DocumentBoxStatus): boolean;
export function getAvailableStatusChangeOptions(currentStatus: DocumentBoxStatus);
```

---

## 테스트 방법

### Phase 1 테스트

1. **새 문서함 생성**
   - 문서함 생성 → status가 OPEN인지 확인
   - 대시보드에서 "열림" Badge 표시 확인

2. **회원 탈퇴**
   - 계정 설정 → 회원 탈퇴
   - 해당 회원의 문서함 status가 CLOSED로 변경되는지 확인
   - 제출 페이지 접근 시 `/submit/closed`로 리다이렉트되는지 확인

3. **후방호환성**
   - 기존 문서함(status 없는) → OPEN으로 취급되는지 확인

### Phase 2 테스트

1. **대시보드 상태 드롭다운**
   - 대시보드에서 문서함 카드의 상태 Badge 클릭
   - OPEN 상태: "닫힘으로 변경" 옵션 표시
   - CLOSED/CLOSED_EXPIRED 상태: "열림으로 변경" 옵션 표시
   - 상태 변경 시 Badge 및 제출 페이지 접근 여부 변경 확인

2. **OPEN_SOMEONE 상태 전환**
   - 마감된 문서함(CLOSED_EXPIRED 또는 CLOSED) 생성
   - 보내기 페이지에서 리마인드 발송 시도
   - Dialog 표시되는지 확인
   - "동의하고 발송" 클릭 → OPEN_SOMEONE으로 변경되는지 확인

3. **리마인드 수신자만 제출 가능**
   - OPEN_SOMEONE 상태 문서함
   - 리마인드 받은 사람: 제출 페이지 접근 가능
   - 리마인드 받지 않은 사람: `/submit/closed`로 리다이렉트

4. **문서함 수정 시 다시 열기**
   - CLOSED/CLOSED_EXPIRED/OPEN_SOMEONE 상태 문서함의 수정 페이지 진입
   - 마감일을 미래로 연장
   - "문서함이 다시 열립니다" Dialog 표시 확인
   - 확인 후 수정완료 → 상태가 OPEN으로 변경되는지 확인

5. **OPEN_RESUME 테스트**
   - CLOSED 상태 문서함에서 드롭다운으로 "열림으로 변경" 선택
   - 상태가 OPEN_RESUME로 변경되는지 확인
   - 모든 사용자 제출 가능한지 확인

6. **자동 상태 전환 Cron Job**
   - 마감일이 지난 OPEN 상태 문서함 생성 (DB 직접 또는 테스트)
   - `curl -X GET http://localhost:3000/api/cron/status-transition` 실행
   - 상태가 CLOSED_EXPIRED로 변경되는지 확인
   - OPEN_SOMEONE, OPEN_RESUME 상태는 변경되지 않는지 확인

---

## 관련 파일

```
prisma/schema.prisma                              # 스키마 정의
lib/types/document.ts                             # 타입, 레이블, 유틸리티 (클라이언트 호환)
lib/auth/public-submit-auth.ts                    # 공개 제출 인증
lib/auth/submitter-auth.ts                        # 지정 제출 인증
lib/auth/submit-redirect.ts                       # 리다이렉트 헬퍼
lib/queries/reminder.ts                           # 리마인드 수신자 확인
app/api/user/delete/route.ts                      # 회원 탈퇴 API
app/api/document-box/[id]/route.ts                # 문서함 수정 API (상태 변경 포함)
app/api/cron/status-transition/route.ts           # 자동 상태 전환 Cron Job
app/dashboard/[id]/actions.ts                     # 상태 변경/리마인드 발송 액션
app/dashboard/page.tsx                            # 대시보드 (상태 표시)
app/dashboard/[id]/send/page.tsx                  # 보내기 페이지
app/dashboard/[id]/edit/page.tsx                  # 문서함 수정 페이지
components/dashboard/DocumentCard.tsx             # 문서함 카드
components/dashboard/StatusChangeDropdown.tsx     # 상태 변경 드롭다운
components/dashboard/SendForm.tsx                 # 보내기 폼 (Dialog 포함)
components/dashboard/document-registration/
  SubmissionSettingsCard.tsx                      # 제출 설정 (다시 열기 Dialog)
lib/hooks/document-box/                           # 폼 훅 (다시 열기 상태 관리)
app/submit/closed/page.tsx                        # 닫힌 문서함 안내 페이지
components/ui/dropdown-menu.tsx                   # 드롭다운 메뉴 UI 컴포넌트
```

---

## 향후 계획

- [ ] 상태 변경 히스토리 로깅
- [ ] 관리자 대시보드에서 상태별 문서함 필터링
