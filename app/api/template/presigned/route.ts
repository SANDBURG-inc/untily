import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { generateUploadUrl } from '@/lib/s3/presigned';

// 허용된 파일 확장자
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.hwp', '.hwpx',
  '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png'
];

// 최대 파일 크기 (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * 양식 파일 업로드용 Presigned URL 생성 API
 *
 * 요청 바디:
 * - filename: 원본 파일명
 * - contentType: MIME 타입
 * - size: 파일 크기 (bytes)
 * - documentBoxId?: 문서함 ID (수정 모드에서 사용)
 * - tempId?: 임시 ID (생성 모드에서 사용, 없으면 서버에서 생성)
 */
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { filename, contentType, size, documentBoxId, tempId } = body;

    // 필수 파라미터 검증
    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 20MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 검증
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: '허용되지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // S3 키 생성
    // documentBoxId가 있으면 사용, 없으면 tempId 사용 (없으면 생성)
    const folderKey = documentBoxId || tempId || crypto.randomUUID();
    const timestamp = Date.now();
    // macOS NFD 한글을 NFC로 정규화 후 안전한 문자만 허용
    const normalizedFilename = filename.normalize('NFC');
    const safeFilename = normalizedFilename.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
    const s3Key = `templates/${folderKey}/${timestamp}_${safeFilename}`;

    // Presigned URL 생성
    const uploadUrl = await generateUploadUrl({
      key: s3Key,
      contentType,
      metadata: {
        originalFilename: filename,
        uploadedBy: user.id,
      },
    });

    return NextResponse.json({
      uploadUrl,
      s3Key,
      tempId: documentBoxId ? undefined : folderKey, // 생성 모드에서만 tempId 반환
    });
  } catch (error) {
    console.error('Template presigned URL 생성 오류:', error);
    return NextResponse.json(
      { error: '업로드 URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
