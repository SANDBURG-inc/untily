/**
 * 사용자별 마지막 사용 템플릿 API
 *
 * GET: 사용자의 마지막 사용 템플릿 조회
 * POST: 마지막 사용 템플릿 저장/업데이트
 *
 * @note v0.2.0에서 documentBoxId 기반 → userId 기반으로 변경됨
 * - 어느 문서함에서 편집하든 같은 템플릿이 로드됨
 * - SEND/SHARE 구분 없이 통일됨
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';

// ============================================================================
// 타입 정의
// ============================================================================

interface LastTemplateResponse {
    success: boolean;
    lastTemplate?: {
        lastTemplateId: string | null;
        lastGreetingHtml: string | null;
        lastFooterHtml: string | null;
    };
    error?: string;
}

interface SaveLastTemplateRequest {
    lastTemplateId?: string | null;
    lastGreetingHtml?: string | null;
    lastFooterHtml?: string | null;
}

// ============================================================================
// GET: 사용자의 마지막 사용 템플릿 조회
// ============================================================================

export async function GET() {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 사용자의 마지막 사용 템플릿 조회
        const lastTemplate = await prisma.userLastTemplate.findUnique({
            where: {
                userId: user.id,
            },
            select: {
                lastTemplateId: true,
                lastGreetingHtml: true,
                lastFooterHtml: true,
            },
        });

        return NextResponse.json<LastTemplateResponse>({
            success: true,
            lastTemplate: lastTemplate ?? undefined,
        });
    } catch (error) {
        console.error('Failed to fetch last template:', error);
        return NextResponse.json<LastTemplateResponse>(
            { success: false, error: 'Failed to fetch last template' },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST: 마지막 사용 템플릿 저장/업데이트
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: SaveLastTemplateRequest = await request.json();
        const { lastTemplateId, lastGreetingHtml, lastFooterHtml } = body;

        // upsert로 설정 저장/업데이트
        const lastTemplate = await prisma.userLastTemplate.upsert({
            where: {
                userId: user.id,
            },
            update: {
                ...(lastTemplateId !== undefined && { lastTemplateId }),
                ...(lastGreetingHtml !== undefined && { lastGreetingHtml }),
                ...(lastFooterHtml !== undefined && { lastFooterHtml }),
            },
            create: {
                userId: user.id,
                lastTemplateId: lastTemplateId ?? null,
                lastGreetingHtml: lastGreetingHtml ?? null,
                lastFooterHtml: lastFooterHtml ?? null,
            },
            select: {
                lastTemplateId: true,
                lastGreetingHtml: true,
                lastFooterHtml: true,
            },
        });

        return NextResponse.json<LastTemplateResponse>({
            success: true,
            lastTemplate,
        });
    } catch (error) {
        console.error('Failed to save last template:', error);
        return NextResponse.json<LastTemplateResponse>(
            { success: false, error: 'Failed to save last template' },
            { status: 500 }
        );
    }
}
