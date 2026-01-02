# S3 업로드 구현 가이드

## 핵심 파일

| 파일 | 설명 | 환경 |
|------|------|------|
| `lib/s3/client.ts` | S3Client 싱글톤 | 서버 |
| `lib/s3/utils.ts` | 공용 유틸 함수 | 공용 |
| `lib/s3/presigned.ts` | Presigned URL 생성/삭제 | 서버 |
| `lib/s3/upload.ts` | 클라이언트 업로드 함수 | 클라이언트 |
| `components/upload/DocumentUploadItem.tsx` | 업로드 UI 컴포넌트 | 클라이언트 |

---

## 클라이언트 업로드 사용법

```typescript
import { uploadFile, replaceFile } from '@/lib/s3/upload';

// 새 파일 업로드
const result = await uploadFile({
  file,
  documentBoxId,
  submitterId,
  requiredDocumentId,
  onProgress: (percent) => console.log(`${percent}%`),
});
// result: { submittedDocumentId, s3Key, fileUrl }

// 파일 교체
const result = await replaceFile({
  file,
  documentBoxId,
  submitterId,
  requiredDocumentId,
  existingDocumentId: '삭제할 문서 ID',
  onProgress,
});
```

---

## 서버 Presigned URL 사용법

```typescript
import { generateUploadUrl, generateDownloadUrl, deleteFromS3 } from '@/lib/s3';

// 업로드용 URL (10분 유효)
const uploadUrl = await generateUploadUrl({
  key: 'uploads/...',
  contentType: 'application/pdf',
});

// 다운로드용 URL (1시간 유효)
const downloadUrl = await generateDownloadUrl('uploads/...');

// 삭제
await deleteFromS3('uploads/...');
```

---

## API 엔드포인트

### POST `/api/upload/presigned`

Presigned URL 발급 + DB 레코드 생성

```typescript
// Request
{ documentBoxId, submitterId, requiredDocumentId, filename, contentType, size }

// Response
{ uploadUrl, submittedDocumentId, s3Key, fileUrl }
```

### DELETE `/api/upload/[id]`

S3 파일 + DB 레코드 삭제

### POST `/api/submit/complete`

제출 완료 처리 (`Submitter.status = 'SUBMITTED'`)

```typescript
// Request
{ submitterId }
```

---

## S3 키 구조

```
uploads/{documentBoxId}/{submitterId}/{requiredDocumentId}/{timestamp}_{filename}
```

---

## Prisma 스키마 참고

```prisma
model SubmittedDocument {
  s3Key               String           @unique
  filename            String
  size                Int
  mimeType            String
  fileUrl             String
  requiredDocumentId  String
  submitterId         String

  @@index([submitterId])
  @@index([requiredDocumentId])
}
```

---

## 업로드 컴포넌트 사용법

```tsx
import DocumentUploadItem from '@/components/upload/DocumentUploadItem';

<DocumentUploadItem
  requiredDocument={doc}
  documentBoxId={documentBoxId}
  submitterId={submitterId}
  existingUpload={existingUpload}  // optional
  onUploadComplete={(upload) => { ... }}
  onUploadError={(error) => { ... }}
/>
```

---

## 환경 변수

```env
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=untily-submissions
```

---

## DB 스키마 적용

```bash
npx prisma db push
npx prisma generate
```
