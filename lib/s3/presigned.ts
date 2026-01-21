import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from './client';

interface GenerateUploadUrlParams {
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * 업로드용 Presigned URL 생성 (10분 유효)
 */
export async function generateUploadUrl({
  key,
  contentType,
  metadata,
}: GenerateUploadUrlParams): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 60 * 10, // 10분
  });
}

/**
 * 다운로드용 Presigned URL 생성 (1시간 유효)
 * @param key S3 키
 * @param filename 다운로드 시 표시될 파일명 (선택, 없으면 원본 파일명)
 */
export async function generateDownloadUrl(key: string, filename?: string): Promise<string> {
  // macOS NFD 한글을 NFC로 정규화 후 안전한 문자만 허용
  const safeFilename = filename
    ? encodeURIComponent(filename.normalize('NFC').replace(/[^\w가-힣._\-() ]/g, '_'))
    : undefined;

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    // 브라우저가 미리보기 대신 다운로드하도록 강제
    ResponseContentDisposition: safeFilename
      ? `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`
      : 'attachment',
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60, // 1시간
  });
}

/**
 * 미리보기용 Presigned URL 생성 (1시간 유효)
 * 브라우저에서 직접 표시 (다운로드 아님)
 */
export async function generatePreviewUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    // 브라우저가 직접 표시하도록 inline 설정
    ResponseContentDisposition: 'inline',
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60, // 1시간
  });
}

/**
 * S3 파일 삭제
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}
