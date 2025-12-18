import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import { generateUploadUrl } from '@/lib/s3/presigned';
import { generateLogoS3Key, getContentType, getFileUrl } from '@/lib/s3/utils';
import { S3_BUCKET, S3_REGION } from '@/lib/s3/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const body = await request.json();
    const { filename, contentType, size, type, documentBoxId } = body as {
      filename: string;
      contentType?: string;
      size?: number;
      type: 'default' | 'documentBox';
      documentBoxId?: string;
    };

    if (!filename || !type) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 3. 문서함 로고인 경우 documentBoxId 검증
    if (type === 'documentBox' && !documentBoxId) {
      return NextResponse.json({ error: '문서함 ID가 필요합니다.' }, { status: 400 });
    }

    // 4. 파일 크기 체크
    if (size && size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기가 10MB를 초과합니다.' }, { status: 400 });
    }

    // 5. 파일 확장자 체크
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: '허용되지 않는 파일 형식입니다. (JPG, PNG만 가능)' },
        { status: 400 }
      );
    }

    // 6. S3 키 생성
    const s3Key = generateLogoS3Key({
      userId: user.id,
      documentBoxId: type === 'documentBox' ? documentBoxId : undefined,
      filename,
    });

    // 7. Content-Type 결정
    const finalContentType = contentType || getContentType(filename);

    // 8. Presigned URL 생성
    const uploadUrl = await generateUploadUrl({
      key: s3Key,
      contentType: finalContentType,
      metadata: {
        'original-filename': encodeURIComponent(filename),
        'user-id': user.id,
        'logo-type': type,
        ...(documentBoxId && { 'document-box-id': documentBoxId }),
      },
    });

    // 9. 파일 URL 생성
    const fileUrl = getFileUrl(s3Key, S3_BUCKET, S3_REGION);

    return NextResponse.json({
      uploadUrl,
      s3Key,
      fileUrl,
    });
  } catch (error) {
    console.error('Logo presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
