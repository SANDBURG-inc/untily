# Logo System - User Side 가이드

이 문서는 서류 제출 페이지(User Side)에서 로고를 표시할 때 필요한 정보를 제공합니다.

## 로고 우선순위

서류 제출 페이지에서 표시할 로고는 다음 우선순위를 따릅니다:

```
1. 문서함 로고 (DOCUMENT_BOX) - 해당 문서함에 설정된 전용 로고
2. 기본 로고 (DEFAULT) - 관리자가 설정한 기본 로고
3. 시스템 로고 - /logo_light.svg (오늘까지 로고)
```

## Database Schema

### Logo 테이블

```prisma
model Logo {
  logoId        String   @id @default(cuid())
  imageUrl      String   // S3에 저장된 이미지 URL
  createdAt     DateTime @default(now())
  userId        String   // 로고 소유자 (관리자 ID)
  type          LogoType @default(DEFAULT)

  // 문서함 로고인 경우에만 사용
  documentBoxId String?
  documentBox   DocumentBox? @relation(...)

  @@unique([userId, type, documentBoxId])
  @@index([userId])
  @@index([documentBoxId])
}

enum LogoType {
  DEFAULT       // 사용자 기본 로고
  DOCUMENT_BOX  // 문서함별 로고
}
```

### DocumentBox와의 관계

```prisma
model DocumentBox {
  documentBoxId  String @id @default(cuid())
  userId         String // 문서함 소유자 (관리자 ID)
  // ... 기타 필드

  logos Logo[]  // 1:N 관계 (실제로는 문서함당 0~1개)
}
```

## 로고 조회 로직

User Side에서 문서함 ID를 기반으로 로고를 조회하는 로직:

```typescript
async function getLogoForDocumentBox(documentBoxId: string): Promise<string> {
  // 문서함 조회 (userId 확인용)
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    select: { userId: true }
  });

  if (!documentBox) {
    return '/logo_light.svg'; // 시스템 기본 로고
  }

  // 1순위: 문서함 전용 로고
  const documentBoxLogo = await prisma.logo.findFirst({
    where: {
      documentBoxId,
      type: 'DOCUMENT_BOX',
    },
  });

  if (documentBoxLogo) {
    return documentBoxLogo.imageUrl;
  }

  // 2순위: 관리자 기본 로고
  const defaultLogo = await prisma.logo.findFirst({
    where: {
      userId: documentBox.userId,
      type: 'DEFAULT',
      documentBoxId: null,
    },
  });

  if (defaultLogo) {
    return defaultLogo.imageUrl;
  }

  // 3순위: 시스템 기본 로고
  return '/logo_light.svg';
}
```

### Prisma Include 사용 예시

문서함 조회 시 로고를 함께 가져오는 경우:

```typescript
const documentBox = await prisma.documentBox.findUnique({
  where: { documentBoxId },
  include: {
    logos: {
      where: { type: 'DOCUMENT_BOX' },
    },
  },
});

// 문서함 로고 확인
const documentBoxLogo = documentBox?.logos[0]?.imageUrl;
```

## 이미지 URL 형식

S3에 저장된 로고 이미지의 URL 형식:

```
https://{BUCKET}.s3.{REGION}.amazonaws.com/logos/{userId}/{filename}
https://{BUCKET}.s3.{REGION}.amazonaws.com/logos/{userId}/document-boxes/{documentBoxId}/{filename}
```

- 기본 로고: `logos/{userId}/` 경로
- 문서함 로고: `logos/{userId}/document-boxes/{documentBoxId}/` 경로

## 이미지 사양

| 항목 | 값 |
|------|-----|
| 권장 크기 | 608px x 144px |
| 최대 파일 크기 | 10MB |
| 지원 형식 | JPG, PNG |

## 구현 체크리스트

User Side 개발 시 확인 사항:

- [ ] 문서함 ID로 로고 URL 조회 로직 구현
- [ ] 로고 우선순위 적용 (문서함 > 기본 > 시스템)
- [ ] 이미지 로딩 실패 시 시스템 로고로 폴백
- [ ] Next.js Image 컴포넌트 사용 시 S3 도메인 허용 설정

### Next.js 이미지 도메인 설정

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
    ],
  },
};
```

## 참고

- 시스템 기본 로고 경로: `/logo_light.svg`
- 관리자 측 로고 업로드 API: `POST /api/logo` (기본 로고), `POST /api/logo/presigned` (업로드 URL)
