# Claude Code 프로젝트 가이드

이 문서는 Claude Code가 프로젝트 작업 시 참고해야 할 아키텍처 결정사항과 컨벤션을 정리합니다.

---

## 프로젝트 구조

```
untily/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # 기본 UI 컴포넌트 (shadcn/ui 기반)
│   ├── shared/             # 공유 컴포넌트 (Table, IconButton, PageHeader 등)
│   └── dashboard/          # 대시보드 전용 컴포넌트
├── lib/
│   ├── types/              # 타입, 상수, 유틸리티 함수
│   ├── queries/            # Prisma 쿼리 레이어
│   └── utils/              # 순수 유틸리티 함수
└── prisma/                 # Prisma 스키마 및 마이그레이션
```

---

## 아키텍처 결정사항

### 1. 데이터 페칭 레이어 분리 (`lib/queries/`)

**결정일**: 2024-12

**배경**: 페이지 컴포넌트에 Prisma 쿼리가 직접 포함되면 코드 비대화 및 재사용성 저하 발생

**결정**:
- Prisma 쿼리는 `lib/queries/{domain}.ts`에 분리
- 페이지 컴포넌트는 쿼리 함수만 import하여 사용
- 쿼리 함수는 명확한 타입과 JSDoc 문서화 필수

**구조**:
```
lib/
├── types/
│   └── reminder.ts         # 타입, 상수, UI 유틸리티
└── queries/
    ├── document-box.ts     # 문서함 쿼리
    └── reminder.ts         # 리마인드 쿼리
```

**역할 분리**:
| 위치 | 역할 |
|------|------|
| `lib/types/{domain}.ts` | 타입 정의, 상수, 레이블 매핑, 포맷팅 함수 |
| `lib/queries/{domain}.ts` | Prisma 쿼리, DB 접근, 데이터 변환 |
| `lib/utils/{domain}.ts` | 순수 유틸리티 함수 (DB 무관) |

**예시**:
```typescript
// lib/queries/reminder.ts
export async function getReminderLogDetail(logId: string, documentBoxId: string) { ... }

// app/dashboard/[id]/reminders/[logId]/page.tsx
import { getReminderLogDetail } from '@/lib/queries/reminder';
const detail = await getReminderLogDetail(logId, documentBoxId);
```

---

### 2. 타입과 유틸리티 분리 (`lib/types/`)

**결정일**: 2024-12

**배경**: 컴포넌트 간 공유되는 타입, 상수, 유틸리티가 여러 파일에 중복 정의됨

**결정**:
- 도메인별로 `lib/types/{domain}.ts` 파일 생성
- 타입, 상수(Enum), 레이블 매핑, 포맷팅 함수 통합 관리
- JSDoc 주석으로 사용법 문서화

**예시 파일 구조** (`lib/types/reminder.ts`):
```typescript
// 상수 (const assertion으로 타입 추론)
export const ReminderChannel = {
    EMAIL: 'EMAIL',
    SMS: 'SMS',
    PUSH: 'PUSH',
} as const;

// 타입
export type ReminderChannelType = (typeof ReminderChannel)[keyof typeof ReminderChannel];

// 레이블 매핑
export const REMINDER_CHANNEL_LABELS: Record<ReminderChannelType, string> = { ... };

// 유틸리티 함수
export function getReminderChannelLabel(channel: ReminderChannelType): string { ... }
export function formatReminderRecipients(recipients: ReminderRecipient[]): string { ... }
```

---

### 3. 컴포넌트 사용 원칙

**UI 컴포넌트** (`components/ui/`):
- shadcn/ui 기반 기본 컴포넌트
- Button, Badge, Card, Dialog, Switch 등

**공유 컴포넌트** (`components/shared/`):
- 여러 페이지에서 재사용되는 컴포넌트
- Table, IconButton, PageHeader, Modal 등

**사용 우선순위**:
1. `components/ui/` 기본 컴포넌트 사용
2. 필요시 `components/shared/` 래퍼 컴포넌트 사용
3. 커스텀 구현은 최후 수단

---

## 코딩 컨벤션

### 파일 구조
```typescript
/**
 * 모듈 설명
 * @module path/to/module
 */

// ============================================================================
// Imports
// ============================================================================

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Main Component / Functions
// ============================================================================
```

### JSDoc 주석
모든 exported 함수에 JSDoc 필수:
```typescript
/**
 * 함수 설명
 *
 * @param param1 - 파라미터 설명
 * @returns 반환값 설명
 *
 * @example
 * const result = myFunction('input');
 */
```

### Import 순서
1. React/Next.js
2. 외부 라이브러리
3. `@/components/`
4. `@/lib/`
5. 상대 경로

---

## 자주 사용하는 패턴

### 페이지 컴포넌트 구조
```typescript
export default async function SomePage({ params }: Props) {
    // 1. 인증
    await ensureAuthenticated();

    // 2. 파라미터 추출
    const { id } = await params;

    // 3. 데이터 조회 (lib/queries/ 사용)
    const data = await getSomeData(id);
    if (!data) notFound();

    // 4. 데이터 변환 (필요시)
    const transformedData = transform(data);

    // 5. 렌더링
    return <Component data={transformedData} />;
}
```

### 쿼리 최적화
독립적인 쿼리는 `Promise.all`로 병렬 실행:
```typescript
const [data1, data2, data3] = await Promise.all([
    query1(),
    query2(),
    query3(),
]);
```
