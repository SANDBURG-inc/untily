
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from './client';

/**
 * S3에서 파일 삭제
 */
export const deleteFromS3 = async (keyData: string | { s3Key: string }): Promise<void> => {
  const key = typeof keyData === 'string' ? keyData : keyData.s3Key;
  
  if (!key) {
    console.warn('S3 key is empty, skipping delete');
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Successfully deleted file from S3: ${key}`);
  } catch (error) {
    console.error(`Failed to delete file from S3 (Key: ${key}):`, error);
    // S3 삭제 실패는 치명적인 에러로 처리하지 않음 (로깅만)
  }
};

/**
 * S3에서 여러 파일 삭제 (순차적 처리)
 * @note DeleteObjectsCommand를 사용하여 배치 삭제로 최적화할 수도 있음
 */
export const deleteMultipleFromS3 = async (keys: string[]) => {
  if (!keys || keys.length === 0) return;
  
  // 병렬 처리
  await Promise.all(keys.map(key => deleteFromS3(key)));
};
