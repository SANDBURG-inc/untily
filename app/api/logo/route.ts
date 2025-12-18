import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import prisma from '@/lib/db';
import { deleteFromS3 } from '@/lib/s3/presigned';
import { S3_BUCKET, S3_REGION } from '@/lib/s3/client';

/**
 * imageUrl에서 S3 키 추출
 */
function extractS3Key(imageUrl: string): string | null {
  const prefix = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/`;
  if (imageUrl.startsWith(prefix)) {
    return imageUrl.slice(prefix.length);
  }
  return null;
}

/**
 * POST - 기본 로고 저장 (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl }: { imageUrl: string } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 });
    }

    // 기존 기본 로고 조회
    const existingLogo = await prisma.logo.findFirst({
      where: {
        userId: user.id,
        type: 'DEFAULT',
        documentBoxId: null,
      },
    });

    if (existingLogo) {
      // 기존 로고가 있으면 S3에서 삭제 후 업데이트
      const oldS3Key = extractS3Key(existingLogo.imageUrl);
      if (oldS3Key) {
        try {
          await deleteFromS3(oldS3Key);
        } catch (err) {
          console.error('Failed to delete old logo from S3:', err);
        }
      }

      const logo = await prisma.logo.update({
        where: { logoId: existingLogo.logoId },
        data: { imageUrl },
      });

      return NextResponse.json({ success: true, logo });
    } else {
      // 새 로고 생성
      const logo = await prisma.logo.create({
        data: {
          userId: user.id,
          imageUrl,
          type: 'DEFAULT',
        },
      });

      return NextResponse.json({ success: true, logo });
    }
  } catch (error) {
    console.error('Logo save error:', error);
    return NextResponse.json(
      { error: '로고 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 기본 로고 삭제
 */
export async function DELETE() {
  try {
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 기존 기본 로고 조회
    const existingLogo = await prisma.logo.findFirst({
      where: {
        userId: user.id,
        type: 'DEFAULT',
        documentBoxId: null,
      },
    });

    if (!existingLogo) {
      return NextResponse.json({ error: '삭제할 로고가 없습니다.' }, { status: 404 });
    }

    // S3에서 파일 삭제
    const s3Key = extractS3Key(existingLogo.imageUrl);
    if (s3Key) {
      try {
        await deleteFromS3(s3Key);
      } catch (err) {
        console.error('Failed to delete logo from S3:', err);
      }
    }

    // DB에서 삭제
    await prisma.logo.delete({
      where: { logoId: existingLogo.logoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logo delete error:', error);
    return NextResponse.json(
      { error: '로고 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET - 기본 로고 조회
 */
export async function GET() {
  try {
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const logo = await prisma.logo.findFirst({
      where: {
        userId: user.id,
        type: 'DEFAULT',
        documentBoxId: null,
      },
    });

    return NextResponse.json({
      success: true,
      logo,
    });
  } catch (error) {
    console.error('Logo fetch error:', error);
    return NextResponse.json(
      { error: '로고 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
