import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { generateUploadUrl } from '@/lib/s3/presigned';
import { generateS3Key, getContentType, getFileUrl } from '@/lib/s3/utils';
import { S3_BUCKET, S3_REGION } from '@/lib/s3/client';

export async function POST(request: NextRequest) {
  try {
    // 1. Neon Auth 인증 확인
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const body = await request.json();
    const { documentBoxId, submitterId, requiredDocumentId, filename, contentType, size } = body;

    if (!documentBoxId || !submitterId || !requiredDocumentId || !filename) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 3. 제출자 검증
    const submitter = await prisma.submitter.findUnique({
      where: { submitterId },
      include: {
        documentBox: {
          include: { requiredDocuments: true },
        },
      },
    });

    if (!submitter || submitter.documentBoxId !== documentBoxId) {
      return NextResponse.json({ error: '유효하지 않은 제출자입니다.' }, { status: 400 });
    }

    // 4. 이메일 검증
    if (submitter.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: '이메일이 일치하지 않습니다.' }, { status: 403 });
    }

    // 5. 만료 체크
    if (new Date() > submitter.documentBox.endDate) {
      return NextResponse.json({ error: '제출 기한이 만료되었습니다.' }, { status: 400 });
    }

    // 6. 이미 제출 완료 체크
    if (submitter.status === 'SUBMITTED') {
      return NextResponse.json({ error: '이미 제출이 완료되었습니다.' }, { status: 400 });
    }

    // 7. 필수 서류 존재 여부 확인
    const requiredDoc = submitter.documentBox.requiredDocuments.find(
      (doc) => doc.requiredDocumentId === requiredDocumentId
    );
    if (!requiredDoc) {
      return NextResponse.json({ error: '유효하지 않은 서류입니다.' }, { status: 400 });
    }

    // 8. 파일 크기 체크 (10MB)
    if (size && size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기가 10MB를 초과합니다.' }, { status: 400 });
    }

    // 9. 파일 확장자 체크
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: '허용되지 않는 파일 형식입니다. (PDF, JPG, PNG만 가능)' }, { status: 400 });
    }

    // 10. S3 키 생성
    const s3Key = generateS3Key({
      documentBoxId,
      submitterId,
      requiredDocumentId,
      filename,
    });

    // 11. Content-Type 결정
    const finalContentType = contentType || getContentType(filename);

    // 12. Presigned URL 생성
    const uploadUrl = await generateUploadUrl({
      key: s3Key,
      contentType: finalContentType,
      metadata: {
        'original-filename': encodeURIComponent(filename),
        'document-box-id': documentBoxId,
        'submitter-id': submitterId,
        'required-document-id': requiredDocumentId,
      },
    });

    // 13. DB에 SubmittedDocument 생성
    const fileUrl = getFileUrl(s3Key, S3_BUCKET, S3_REGION);

    const submittedDocument = await prisma.submittedDocument.create({
      data: {
        s3Key,
        filename,
        size: size || 0,
        mimeType: finalContentType,
        fileUrl,
        requiredDocumentId,
        submitterId,
      },
    });

    return NextResponse.json({
      uploadUrl,
      submittedDocumentId: submittedDocument.submittedDocumentId,
      s3Key,
      fileUrl,
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
