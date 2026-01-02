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
 */
export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
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
