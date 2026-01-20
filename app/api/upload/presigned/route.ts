import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { generateUploadUrl } from '@/lib/s3/presigned';
import { generateS3Key, getContentType, getFileUrl, generateSubmittedFilename } from '@/lib/s3/utils';
import { S3_BUCKET, S3_REGION } from '@/lib/s3/client';
import { hasDesignatedSubmitters } from '@/lib/utils/document-box';
import { isDocumentBoxClosed, type DocumentBoxStatus } from '@/lib/types/document';

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

    // 4. 권한 검증 (지정 제출자 vs 공개 제출)
    if (hasDesignatedSubmitters(submitter.documentBox.hasSubmitter)) {
      // 지정 제출자: 이메일 매칭 검증
      if (submitter.email.toLowerCase() !== user.email?.toLowerCase()) {
        return NextResponse.json({ error: '이메일이 일치하지 않습니다.' }, { status: 403 });
      }
    } else {
      // 공개 제출: userId 매칭 검증
      if (submitter.userId !== user.id) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }
    }

    // 5. 제출 가능 상태 체크 (status 기반)
    if (isDocumentBoxClosed(submitter.documentBox.status as DocumentBoxStatus)) {
      return NextResponse.json({ error: '제출이 마감되었습니다.' }, { status: 400 });
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

    // 9. 파일 확장자 체크 (위험한 실행 파일만 차단)
    const blockedExtensions = [
      'exe', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'msi', 'scr', 'com', 'pif',
      'hta', 'cpl', 'msc', 'gadget', 'inf', 'reg', 'lnk', 'ws', 'wsf', 'wsc', 'wsh',
    ];
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && blockedExtensions.includes(ext)) {
      return NextResponse.json({ error: '보안상의 이유로 이 파일 형식은 업로드할 수 없습니다.' }, { status: 400 });
    }

    // 10. S3 키 생성 (식별용 - timestamp + 원본파일명)
    const s3Key = generateS3Key({
      documentBoxId,
      submitterId,
      requiredDocumentId,
      filename,
    });

    // 11. 저장용 파일명 생성 (사용자에게 보여지는 이름)
    // 형식: {서류명}_{날짜}_{제출자이름}.{확장자}
    const displayFilename = generateSubmittedFilename({
      requiredDocumentTitle: requiredDoc.documentTitle,
      submitterName: submitter.name,
      originalFilename: filename,
    });

    // 12. Content-Type 결정
    const finalContentType = contentType || getContentType(filename);

    // 13. Presigned URL 생성
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

    // 14. DB에 SubmittedDocument 생성
    const fileUrl = getFileUrl(s3Key, S3_BUCKET, S3_REGION);

    const submittedDocument = await prisma.submittedDocument.create({
      data: {
        s3Key,
        filename: displayFilename, // 관리자용 가공 파일명
        originalFilename: filename, // 원본 파일명
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
      filename: displayFilename, // 관리자용 가공 파일명
      originalFilename: filename, // 원본 파일명 (UI 표시용)
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
