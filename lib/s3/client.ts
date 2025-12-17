import { S3Client } from '@aws-sdk/client-s3';

// S3Client 싱글톤 (서버 전용)
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'untily-submissions';
export const S3_REGION = process.env.AWS_REGION || 'ap-northeast-2';
