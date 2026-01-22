/**
 * 문서함별 템플릿 설정 API
 *
 * GET: 문서함의 마지막 사용 템플릿 조회
 * POST: 문서함의 마지막 사용 템플릿 저장/업데이트
 *
 * @note 문서함별로 마지막 사용 템플릿 유지
 * - 각 문서함에 진입하면 해당 문서함에서 마지막 사용한 템플릿이 로드됨
 * - 자동 리마인더도 이 템플릿을 사용
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
        lastTemplateName: string | null;
        lastGreetingHtml: string | null;
        lastFooterHtml: string | null;
    };
    error?: string;
}

interface SaveLastTemplateRequest {
    documentBoxId: string;
    lastTemplateId?: string | null;
    lastGreetingHtml?: string | null;
    lastFooterHtml?: string | null;
}

// ============================================================================
// GET: 문서함의 마지막 사용 템플릿 조회
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const documentBoxId = searchParams.get('documentBoxId');

        if (!documentBoxId) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'documentBoxId is required' },
                { status: 400 }
            );
        }

        // 문서함 소유권 확인
        const documentBox = await prisma.documentBox.findFirst({
            where: {
                documentBoxId,
                userId: user.id,
            },
        });

        if (!documentBox) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'Document box not found' },
                { status: 404 }
            );
        }

        // 문서함의 마지막 사용 템플릿 조회
        const templateConfig = await prisma.documentBoxTemplateConfig.findUnique({
            where: {
                documentBoxId,
            },
            select: {
                lastTemplateId: true,
                lastGreetingHtml: true,
                lastFooterHtml: true,
            },
        });

        // 템플릿 이름 조회 (lastTemplateId가 있는 경우)
        let lastTemplateName: string | null = null;
        if (templateConfig?.lastTemplateId) {
            const template = await prisma.remindTemplate.findUnique({
                where: { id: templateConfig.lastTemplateId },
                select: { name: true },
            });
            lastTemplateName = template?.name ?? null;
        }

        return NextResponse.json<LastTemplateResponse>({
            success: true,
            lastTemplate: templateConfig
                ? {
                    ...templateConfig,
                    lastTemplateName,
                }
                : undefined,
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
// POST: 문서함의 마지막 사용 템플릿 저장/업데이트
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
        const { documentBoxId, lastTemplateId, lastGreetingHtml, lastFooterHtml } = body;

        if (!documentBoxId) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'documentBoxId is required' },
                { status: 400 }
            );
        }

        // 문서함 소유권 확인
        const documentBox = await prisma.documentBox.findFirst({
            where: {
                documentBoxId,
                userId: user.id,
            },
        });

        if (!documentBox) {
            return NextResponse.json<LastTemplateResponse>(
                { success: false, error: 'Document box not found' },
                { status: 404 }
            );
        }

        // upsert로 설정 저장/업데이트
        const templateConfig = await prisma.documentBoxTemplateConfig.upsert({
            where: {
                documentBoxId,
            },
            update: {
                ...(lastTemplateId !== undefined && { lastTemplateId }),
                ...(lastGreetingHtml !== undefined && { lastGreetingHtml }),
                ...(lastFooterHtml !== undefined && { lastFooterHtml }),
            },
            create: {
                documentBoxId,
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
            lastTemplate: {
                ...templateConfig,
                lastTemplateName: null, // POST에서는 템플릿 이름 조회 생략
            },
        });
    } catch (error) {
        console.error('Failed to save last template:', error);
        return NextResponse.json<LastTemplateResponse>(
            { success: false, error: 'Failed to save last template' },
            { status: 500 }
        );
    }
}
