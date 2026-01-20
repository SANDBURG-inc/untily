# 약관 및 회원 탈퇴 기능

## 개요

이 문서는 서비스 이용약관, 개인정보처리방침 표시 및 회원 탈퇴 기능의 구현 방식과 동작 원리를 설명합니다.

**시행일**: 2026년 1월 14일

---

## 1. 약관 및 개인정보처리방침

### 1.1 콘텐츠 저장 방식

약관 내용은 TypeScript 파일로 저장되어 있으며, 템플릿 리터럴을 사용하여 마크다운 형식으로 작성되었습니다.

**파일 구조:**
```
content/
├── terms-of-service.ts      # 이용약관
├── privacy-policy.ts         # 개인정보처리방침
└── index.ts                  # export
```

**예시:**
```typescript
export const termsOfService = `# 서비스 이용약관

## 제1조 목적
...
`;
```

**이유:**
- 마크다운 파일(`.md`)을 import하기 위한 추가 설정 불필요
- TypeScript로 타입 안전성 확보
- 빌드 시 번들에 포함되어 별도 파일 요청 없음

### 1.2 모달 컴포넌트

약관은 페이지 전환 없이 모달로 표시됩니다.

**컴포넌트 구조:**
```
components/legal/
├── LegalLinks.tsx           # 재사용 가능한 링크 컴포넌트
├── TermsModal.tsx           # 이용약관 모달
├── PrivacyPolicyModal.tsx   # 개인정보처리방침 모달
└── index.ts                 # export
```

**LegalLinks 컴포넌트:**
- "이용약관 | 개인정보처리방침" 링크 표시
- 클릭 시 해당 모달 오픈
- 푸터, 로그인, 회원가입 페이지에서 재사용

**Props:**
```typescript
interface LegalLinksProps {
  className?: string;           // 컨테이너 스타일
  linkClassName?: string;       // 링크 스타일
  showDivider?: boolean;        // 구분자 | 표시 여부
  dividerClassName?: string;    // 구분자 스타일
}
```

**모달 특징:**
- Radix UI Dialog 사용 (기존 패턴 일관성)
- 큰 사이즈 (`max-w-3xl`)
- 스크롤 가능한 본문 (`max-h-[85vh] overflow-y-auto`)
- MarkdownViewer로 렌더링

### 1.3 약관 동의 문구

로그인 및 회원가입 페이지에 약관 동의 안내가 표시됩니다.

**위치:**
- `/sign-in` - SignInForm 하단
- `/sign-up` - SignUpForm 하단

**내용:**
```
로그인하면 하단 정책에 모두 동의한 것으로 간주합니다.
이용약관 | 개인정보처리방침
```

**동작:**
- 링크 클릭 시 해당 약관 모달 표시
- 묵시적 동의 방식 (별도 체크박스 없음)
- OAuth(Google) 로그인도 동일하게 적용

### 1.4 푸터 업데이트

푸터에 사업자 정보 및 약관 링크가 추가되었습니다.

**추가 정보:**
```
사업자등록번호 : 880-86-02354 | 주식회사 샌드버그 | 대표이사 : 배호진
48400 부산광역시 남구 전포대로 133, 14층 111호(문현동, WeWork BIFC)
고객센터 : 051-711-4488 | 이메일 : contact@sandburg.co.kr

서비스 이용약관 | 개인정보 처리방침 | 제휴문의
```

**스타일:**
- 작은 글씨 (`text-xs`) - 슬림한 디자인
- 구분자 `|`로 정보 분리
- 제휴문의는 `mailto:` 링크

---

## 2. 회원 탈퇴 기능

### 2.1 탈퇴 UI

**위치:** `/account/settings` 페이지 하단

**구성:**
- 작은 빨간 글씨 '탈퇴하기' 버튼 (`text-xs text-red-500`)
- 클릭 시 DeleteAccountDialog 표시

**DeleteAccountDialog:**
```
제목: 회원 탈퇴 (빨간색)

내용:
- 탈퇴 시 이전 제출내역이 모두 삭제됩니다.
- 단, 이미 제출한 자료는 삭제되지 않습니다.
- 회원탈퇴에 동의하십니까?

버튼: [취소] [탈퇴]
```

### 2.2 탈퇴 API

**엔드포인트:** `DELETE /api/user/delete`

**인증:** Neon Auth 세션 필수

**처리 순서:**

1. **인증 확인**
   - `neonAuth()`로 현재 사용자 확인
   - 미로그인 시 401 Unauthorized

2. **데이터 조회 및 S3 키 수집**
   - 사용자의 모든 문서함 조회 (submitters, requiredDocuments, logos 포함)
   - 삭제할 S3 키 목록 생성:
     - 제출된 파일 (`submittedDocuments.s3Key`)
     - 양식 파일 (`requiredDocuments.templates[].s3Key`)
     - 양식 ZIP (`requiredDocuments.templateZipKey`)
     - 문서함 로고 (`logos.imageUrl`)
     - 기본 로고 (`type='DEFAULT'`)

3. **데이터베이스 삭제 (트랜잭션)**
   ```
   문서함별로:
   ├── ReminderRecipient (알림 수신자)
   ├── ReminderLog (알림 기록)
   ├── SubmittedDocument (제출 파일)
   ├── Submitter (제출자)
   ├── RequiredDocument (필수 서류)
   ├── DocumentBoxRemindType (알림 타입)
   └── Logo (문서함 로고)

   사용자:
   ├── DocumentBox (문서함)
   └── Logo (기본 로고)
   ```

4. **S3 파일 삭제**
   - 트랜잭션 성공 후 수집된 S3 키 삭제
   - `deleteMultipleFromS3()` 사용 (병렬 처리)
   - S3 삭제 실패는 로깅만 (치명적 에러 아님)

5. **로그아웃 및 리다이렉트**
   - 클라이언트에서 `authClient.signOut()` 호출
   - 홈페이지(`/`)로 리다이렉트

### 2.3 삭제되는 데이터

| 테이블 | 설명 | 삭제 방식 |
|--------|------|-----------|
| `DocumentBox` | 문서함 | `userId` 기준 삭제 |
| `Logo` | 로고 (문서함 + 기본) | 문서함 로고 + 기본 로고 삭제, S3 파일도 삭제 |
| `Submitter` | 제출자 | 문서함에 속한 제출자 모두 삭제 |
| `SubmittedDocument` | 제출 파일 | 제출자의 제출 파일 모두 삭제, S3 파일도 삭제 |
| `RequiredDocument` | 필수 서류 | 문서함에 속한 서류 모두 삭제, 양식 파일도 S3에서 삭제 |
| `DocumentBoxRemindType` | 알림 타입 | 문서함에 속한 알림 타입 삭제 |
| `ReminderLog` | 알림 기록 | 문서함에 속한 알림 기록 삭제 |
| `ReminderRecipient` | 알림 수신자 | 제출자/알림기록에 속한 수신자 삭제 |

### 2.4 삭제되지 않는 데이터

**Neon Auth 사용자 계정:**
- 데이터베이스만 삭제되고, Neon Auth 계정은 남아있음
- 이유: Neon Auth API에서 사용자 삭제 기능을 프로젝트에서 미사용
- 재가입 시 동일 이메일로 새 계정 생성 가능

### 2.5 안전 장치

**트랜잭션:**
- Prisma 트랜잭션으로 원자성 보장
- 중간에 실패 시 모든 변경 롤백

**삭제 순서:**
- 외래 키 제약 조건 고려한 순서로 삭제
- 자식 데이터 먼저, 부모 데이터 나중

**S3 삭제:**
- 트랜잭션 성공 후에만 S3 파일 삭제
- S3 삭제 실패는 에러로 처리하지 않음 (고아 파일 생성 가능하지만 서비스는 정상)

**확인 다이얼로그:**
- 사용자에게 명확한 경고 메시지 표시
- "탈퇴" 버튼 클릭해야만 실행

---

## 3. 기술 스택

### 3.1 마크다운 렌더링

**라이브러리:**
- `react-markdown` - 마크다운 파싱 및 렌더링
- `remark-gfm` - GitHub Flavored Markdown 지원

**MarkdownViewer 컴포넌트:**
```typescript
components/shared/MarkdownViewer.tsx
```

**커스터마이징:**
- Tailwind CSS 스타일 적용
- 제목, 본문, 리스트, 링크, 테이블 등 커스텀 렌더링
- `prose` 클래스 사용 (Typography 플러그인)

### 3.2 UI 컴포넌트

**Dialog:** Radix UI Dialog
- 접근성 지원
- 애니메이션 포함
- 키보드 네비게이션

**Button:** 커스텀 Button 컴포넌트
- CVA(Class Variance Authority) 기반
- Variants: `outline`, `destructive`

### 3.3 인증

**Neon Auth (Better Auth 기반):**
- 서버: `neonAuth()` - 서버 컴포넌트/API
- 클라이언트: `authClient` - 클라이언트 컴포넌트

**세션 관리:**
- 쿠키 기반 세션
- 로그아웃: `authClient.signOut()`

---

## 4. 사용 예시

### 4.1 약관 모달 사용

```tsx
import { LegalLinks } from '@/components/legal';

// 기본 사용
<LegalLinks />

// 커스터마이징
<LegalLinks
  className="justify-center"
  linkClassName="text-xs text-gray-400"
  showDivider={true}
/>
```

### 4.2 회원 탈퇴 처리

**클라이언트:**
```typescript
const response = await fetch('/api/user/delete', {
  method: 'DELETE',
});

if (response.ok) {
  await authClient.signOut();
  router.push('/');
}
```

**서버 (API 라우트):**
```typescript
// 1. 인증 확인
const { user } = await neonAuth();

// 2. 트랜잭션으로 데이터 삭제
await prisma.$transaction(async (tx) => {
  // ... 삭제 로직
});

// 3. S3 파일 삭제
await deleteMultipleFromS3(s3KeysToDelete);
```

---

## 5. 주의사항

### 5.1 약관 수정 시

1. `content/terms-of-service.ts` 또는 `content/privacy-policy.ts` 수정
2. 시행일 업데이트 (`부칙` 섹션)
3. 빌드 재실행 (번들에 반영)

### 5.2 회원 탈퇴 시

**데이터 복구 불가:**
- 트랜잭션 완료 후 복구 불가능
- 사용자에게 명확히 안내 필요

**S3 파일:**
- 고아 파일이 생성될 수 있음 (S3 삭제 실패 시)
- 정기적인 S3 정리 작업 고려 필요

**Neon Auth 계정:**
- 현재 구현에서는 Neon Auth 계정 미삭제
- 필요 시 Neon Auth API로 추가 구현 가능

---

## 6. 향후 개선 사항

### 6.1 약관

- [ ] 약관 버전 관리 시스템
- [ ] 약관 변경 시 사용자 동의 재확인
- [ ] 약관 변경 이력 저장

### 6.2 회원 탈퇴

- [ ] Neon Auth 계정도 함께 삭제
- [ ] 탈퇴 전 데이터 다운로드 기능
- [ ] 탈퇴 쿨다운 기간 (7일 등)
- [ ] 탈퇴 사유 수집
- [ ] S3 고아 파일 정리 배치 작업

---

## 7. 관련 파일

### 약관

```
content/
├── terms-of-service.ts
├── privacy-policy.ts
└── index.ts

components/legal/
├── LegalLinks.tsx
├── TermsModal.tsx
├── PrivacyPolicyModal.tsx
└── index.ts

components/shared/
└── MarkdownViewer.tsx

components/layout/
└── Footer.tsx (수정)

components/auth/
├── SignInForm.tsx (수정)
└── SignUpForm.tsx (수정)
```

### 회원 탈퇴

```
app/api/user/delete/
└── route.ts

components/settings/
└── DeleteAccountDialog.tsx

app/account/[path]/
├── page.tsx (수정)
└── DeleteAccountSection.tsx

lib/s3/
└── delete.ts (재사용)
```
