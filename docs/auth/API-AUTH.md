# API 엔드포인트 인증 가이드

이 문서는 API 라우트에서 인증을 구현하는 방법을 설명합니다.

## 개요

모든 보호된 API 엔드포인트는 `neonAuth()` 함수를 사용하여 인증을 확인합니다. 인증이 필요한 API에서는 반드시 요청 초기에 인증 체크를 수행해야 합니다.

---

## 기본 인증 패턴

### 가장 기본적인 형태

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';

export async function GET() {
  // 1. 인증 확인
  const { user } = await neonAuth();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. 인증된 사용자의 요청 처리
  return NextResponse.json({
    message: 'Hello',
    userId: user.id,
  });
}
```

---

## HTTP 상태 코드

| 코드 | 의미 | 사용 상황 |
|------|------|----------|
| `401` | Unauthorized | 로그인하지 않은 경우 |
| `403` | Forbidden | 로그인했지만 권한이 없는 경우 |
| `400` | Bad Request | 요청 데이터가 잘못된 경우 |
| `404` | Not Found | 리소스를 찾을 수 없는 경우 |
| `500` | Internal Server Error | 서버 오류 |

### 401 vs 403 구분

```typescript
export async function GET(request: Request, { params }) {
  const { user } = await neonAuth();

  // 로그인하지 않음 → 401
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
  });

  // 리소스가 없음 → 404
  if (!resource) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  // 로그인했지만 소유자가 아님 → 403
  if (resource.userId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return NextResponse.json(resource);
}
```

---

## 실제 사용 예시

### POST 요청 - 리소스 생성

```typescript
// app/api/document-box/route.ts
import { NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { documentName, deadline } = body;

    // 필수 필드 검증
    if (!documentName || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 데이터 생성 (userId 연결)
    const documentBox = await prisma.documentBox.create({
      data: {
        boxTitle: documentName,
        endDate: new Date(deadline),
        userId: user.id,  // 현재 사용자 ID 연결
      },
    });

    return NextResponse.json({
      success: true,
      documentBoxId: documentBox.documentBoxId,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### PUT 요청 - 리소스 수정 (소유권 확인)

```typescript
// app/api/document-box/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. 리소스 존재 확인
    const existingBox = await prisma.documentBox.findUnique({
      where: { documentBoxId: id },
    });

    if (!existingBox) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    // 3. 소유권 확인
    if (existingBox.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 4. 업데이트 수행
    const body = await request.json();
    const updatedBox = await prisma.documentBox.update({
      where: { documentBoxId: id },
      data: {
        boxTitle: body.documentName,
        boxDescription: body.description,
      },
    });

    return NextResponse.json({
      success: true,
      documentBoxId: updatedBox.documentBoxId,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 제출자 전용 API (이메일 검증 포함)

```typescript
// app/api/upload/presigned/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 바디 파싱
    const body = await request.json();
    const { documentBoxId, submitterId } = body;

    // 3. 제출자 조회
    const submitter = await prisma.submitter.findUnique({
      where: { submitterId },
      include: { documentBox: true },
    });

    if (!submitter || submitter.documentBoxId !== documentBoxId) {
      return NextResponse.json(
        { error: '유효하지 않은 제출자입니다.' },
        { status: 400 }
      );
    }

    // 4. 이메일 검증 (대소문자 무시)
    if (submitter.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: '이메일이 일치하지 않습니다.' },
        { status: 403 }
      );
    }

    // 5. 만료 체크
    if (new Date() > submitter.documentBox.endDate) {
      return NextResponse.json(
        { error: '제출 기한이 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 6. 비즈니스 로직 수행
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

---

## 응답 형식 표준화

### 성공 응답

```typescript
// 생성/수정 성공
return NextResponse.json({
  success: true,
  documentBoxId: '...',
});

// 조회 성공
return NextResponse.json({
  data: result,
});

// 목록 조회 성공
return NextResponse.json({
  data: items,
  count: items.length,
});
```

### 에러 응답

```typescript
// 표준 에러 형식
return NextResponse.json(
  {
    success: false,
    error: '에러 메시지',
  },
  { status: 400 }
);

// 또는 간단한 형식
return NextResponse.json(
  { error: '에러 메시지' },
  { status: 400 }
);
```

---

## 인증 체크리스트

새 API 엔드포인트를 만들 때 확인할 사항:

### 1. 인증 필요 여부 결정

- [ ] 이 API는 인증이 필요한가?
- [ ] 공개 API인가? (예: 문의 폼)

### 2. 권한 수준 결정

- [ ] 로그인만 필요한가?
- [ ] 리소스 소유자만 접근 가능한가?
- [ ] 제출자 이메일 검증이 필요한가?

### 3. 검증 순서

```typescript
export async function handler() {
  // 1. 인증 확인 (필수)
  const { user } = await neonAuth();
  if (!user) return unauthorized();

  // 2. 요청 데이터 검증
  const body = await request.json();
  if (!isValid(body)) return badRequest();

  // 3. 리소스 존재 확인
  const resource = await findResource();
  if (!resource) return notFound();

  // 4. 권한 확인 (소유권, 이메일 등)
  if (!hasPermission(user, resource)) return forbidden();

  // 5. 비즈니스 로직
  return success();
}
```

---

## 에러 핸들링 패턴

### try-catch 사용

```typescript
export async function POST(request: Request) {
  try {
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 비즈니스 로직
    const result = await someOperation();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 로깅
    console.error('API Error:', error);

    // 에러 타입별 처리
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 기본 에러 응답
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## user 객체 활용

`neonAuth()`가 반환하는 user 객체:

```typescript
const { user } = await neonAuth();

// user 객체 구조
{
  id: string;           // 사용자 고유 ID
  email: string;        // 이메일 주소
  name: string;         // 사용자 이름
  image?: string;       // 프로필 이미지 URL
  emailVerified: boolean; // 이메일 인증 여부
  createdAt: Date;
  updatedAt: Date;
}
```

### user.id 활용 예시

```typescript
// 리소스 생성 시 소유자 연결
await prisma.documentBox.create({
  data: {
    boxTitle: 'My Box',
    userId: user.id,  // 현재 사용자를 소유자로 설정
  },
});

// 소유 리소스 조회
const myBoxes = await prisma.documentBox.findMany({
  where: { userId: user.id },
});

// 소유권 확인
if (existingBox.userId !== user.id) {
  return forbidden();
}
```

### user.email 활용 예시

```typescript
// 제출자 이메일 검증
const submitter = await prisma.submitter.findUnique({
  where: { submitterId },
});

// 대소문자 무시하여 비교
if (submitter.email.toLowerCase() !== user.email?.toLowerCase()) {
  return NextResponse.json(
    { error: '이메일이 일치하지 않습니다.' },
    { status: 403 }
  );
}
```

---

## API 목록 및 인증 요구사항

| 엔드포인트 | 메서드 | 인증 | 권한 |
|-----------|--------|------|------|
| `/api/auth/[...path]` | GET, POST | - | Neon Auth 핸들러 |
| `/api/document-box` | POST | 필요 | 로그인 사용자 |
| `/api/document-box/[id]` | PUT | 필요 | 소유자만 |
| `/api/document-boxes` | GET | 필요 | 자신의 것만 |
| `/api/upload/presigned` | POST | 필요 | 제출자 + 이메일 검증 |
| `/api/upload/[id]` | DELETE | 필요 | 제출자 |
| `/api/submit/complete` | POST | 필요 | 제출자 + 이메일 검증 |
| `/api/contact` | POST | 불필요 | 공개 API |
| `/api/cron/reminders` | GET | 특수 | Cron 토큰 검증 |

---

## 클라이언트에서 API 호출

### 인증된 API 호출

```typescript
'use client';

async function createDocumentBox(data: CreateDocumentBoxRequest) {
  const response = await fetch('/api/document-box', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    // credentials는 자동으로 same-origin으로 설정됨
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/sign-in';
      return;
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to create');
  }

  return response.json();
}
```

### 에러 처리

```typescript
try {
  const result = await createDocumentBox(formData);
  // 성공 처리
} catch (error) {
  if (error.message === 'Unauthorized') {
    // 로그인 필요
    router.push('/sign-in');
  } else {
    // 다른 에러 표시
    setError(error.message);
  }
}
```

---

## 관련 문서

- [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) - 전체 인증 시스템 개요
- [SUBMITTER-AUTH.md](./SUBMITTER-AUTH.md) - 제출자 인증 가이드
