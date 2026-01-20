import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';
import { s3Client, S3_BUCKET } from './client';
import { deleteFromS3 } from './delete';
import type { TemplateFile } from '@/lib/types/document';

interface CreateTemplateZipParams {
  templates: TemplateFile[];
  documentBoxId: string;
  requiredDocumentId: string;
  /** 문서함 이름 (ZIP 파일명에 사용) */
  boxTitle?: string;
  /** 서류 제목 (ZIP 파일명에 사용) */
  documentTitle?: string;
}

// ZIP 파일 최대 크기 제한 (50MB)
const MAX_ZIP_SIZE = 50 * 1024 * 1024;

/**
 * 파일명 중복 처리 헬퍼
 * 같은 이름의 파일이 있으면 (2), (3) 등 접미사 추가
 */
function getUniqueFilename(filename: string, existingNames: Set<string>): string {
  if (!existingNames.has(filename)) {
    existingNames.add(filename);
    return filename;
  }

  const lastDotIndex = filename.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex);
  const extension = lastDotIndex === -1 ? '' : filename.slice(lastDotIndex);

  let counter = 2;
  let newName = `${baseName} (${counter})${extension}`;

  while (existingNames.has(newName)) {
    counter++;
    newName = `${baseName} (${counter})${extension}`;
  }

  existingNames.add(newName);
  return newName;
}

/**
 * S3에서 파일 가져오기 (타임아웃 포함)
 */
async function getFileFromS3(s3Key: string): Promise<Buffer | null> {
  const TIMEOUT_MS = 30000; // 30초 타임아웃

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });

    // 타임아웃 Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`S3 GetObject timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
    });

    // S3 요청과 타임아웃 경쟁
    const response = await Promise.race([
      s3Client.send(command),
      timeoutPromise,
    ]);

    const bodyStream = response.Body;
    if (!bodyStream) return null;

    // Stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of bodyStream as Readable) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`Failed to get file from S3: ${s3Key}`, error);
    return null;
  }
}

/**
 * Buffer를 Stream으로 변환
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new PassThrough();
  stream.end(buffer);
  return stream;
}

/**
 * 양식 파일들을 ZIP으로 묶어 S3에 업로드
 *
 * @param templates 양식 파일 목록
 * @param documentBoxId 문서함 ID
 * @param requiredDocumentId 서류 ID
 * @returns ZIP 파일의 S3 키, 실패 시 null
 */
export async function createTemplateZip({
  templates,
  documentBoxId,
  requiredDocumentId,
  boxTitle,
  documentTitle,
}: CreateTemplateZipParams): Promise<string | null> {
  // 2개 미만이면 ZIP 생성 불필요
  if (templates.length < 2) {
    return null;
  }

  const zipKey = `templates/${documentBoxId}_zip/${requiredDocumentId}.zip`;
  const existingNames = new Set<string>();

  try {
    // 1. 각 파일을 S3에서 병렬로 가져오기
    const filePromises = templates.map(async (template) => {
      const buffer = await getFileFromS3(template.s3Key);
      return {
        filename: template.filename,
        buffer,
      };
    });

    const files = await Promise.all(filePromises);

    // 유효한 파일만 필터링
    const validFiles = files.filter((f): f is { filename: string; buffer: Buffer } =>
      f.buffer !== null
    );

    if (validFiles.length < 2) {
      return null;
    }

    // 2. 총 파일 크기 확인
    const totalSize = validFiles.reduce((sum, f) => sum + f.buffer.length, 0);
    if (totalSize > MAX_ZIP_SIZE) {
      console.warn(`Total file size (${totalSize}) exceeds MAX_ZIP_SIZE (${MAX_ZIP_SIZE})`);
      return null;
    }

    // 3. archiver로 ZIP 생성
    const archive = archiver('zip', {
      zlib: { level: 6 }, // 압축 레벨
    });

    // ZIP 데이터를 메모리에 수집하고 완료 대기
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', reject);

      // 파일 추가 (중복 파일명 처리)
      for (const file of validFiles) {
        const uniqueName = getUniqueFilename(file.filename, existingNames);
        archive.append(file.buffer, { name: uniqueName });
      }

      // finalize는 리스너 등록 후에 호출
      archive.finalize();
    });

    // 4. S3에 ZIP 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: zipKey,
      Body: zipBuffer,
      ContentType: 'application/zip',
    });

    await s3Client.send(uploadCommand);

    return zipKey;
  } catch (error) {
    console.error('Failed to create template ZIP:', error);
    return null;
  }
}

/**
 * ZIP 다운로드용 파일명 생성
 * 형식: {문서함이름}-{서류이름}-양식.zip
 */
export function getZipFilename(boxTitle: string, documentTitle: string): string {
  // 파일명에서 사용 불가능한 문자 제거
  const sanitize = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
  return `${sanitize(boxTitle)}-${sanitize(documentTitle)}-양식.zip`;
}

/**
 * 양식 ZIP 파일 삭제
 */
export async function deleteTemplateZip(zipKey: string | null | undefined): Promise<void> {
  if (!zipKey) return;
  await deleteFromS3(zipKey);
}

/**
 * 양식 파일 변경 여부 확인
 * (기존 템플릿과 새 템플릿의 s3Key 배열 비교)
 */
export function hasTemplatesChanged(
  existingTemplates: TemplateFile[] | null | undefined,
  newTemplates: TemplateFile[] | null | undefined
): boolean {
  const existing = existingTemplates || [];
  const updated = newTemplates || [];

  // 개수가 다르면 변경됨
  if (existing.length !== updated.length) {
    return true;
  }

  // s3Key 목록 비교 (순서 무관)
  const existingKeys = new Set(existing.map(t => t.s3Key));
  const newKeys = new Set(updated.map(t => t.s3Key));

  for (const key of newKeys) {
    if (!existingKeys.has(key)) {
      return true;
    }
  }

  return false;
}
