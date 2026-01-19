/**
 * 문서함별 템플릿 설정 API
 *
 * GET: 문서함별 템플릿 설정 조회 (마지막 사용 템플릿, 자동 리마인더 템플릿)
 * POST: 문서함별 템플릿 설정 저장/업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import type { TemplateType } from '@/lib/generated/prisma/client';

// ============================================================================
// 타입 정의
// ============================================================================

interface ConfigResponse {
    success: boolean;
    config?: {
        id: string;
        documentBoxId: string;
        type: TemplateType;
        lastTemplateId: string | null;
        lastGreetingHtml: string | null;
        lastFooterHtml: string | null;
        autoTemplateId: string | null;
    };
    error?: string;
}

interface SaveConfigRequest {
    documentBoxId: string;
    type: 'SEND' | 'SHARE';
    // 마지막 사용 템플릿 정보
    lastTemplateId?: string | null;
    lastGreetingHtml?: string | null;
    lastFooterHtml?: string | null;
    // 자동 리마인더용 템플릿
    autoTemplateId?: string | null;
}

// ============================================================================
// GET: 문서함별 템플릿 설정 조회
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<ConfigResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const documentBoxId = searchParams.get('documentBoxId');
        const type = searchParams.get('type') as TemplateType | null;

        if (!documentBoxId || !type) {
            return NextResponse.json<ConfigResponse>(
                { success: false, error: 'documentBoxId and type are required' },
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
            return NextResponse.json<ConfigResponse>(
                { success: false, error: 'Document box not found' },
                { status: 404 }
            );
        }

        // 설정 조회
        const config = await prisma.documentBoxTemplateConfig.findUnique({
            where: {
                documentBoxId_type: {
                    documentBoxId,
                    type,
                },
            },
        });

        if (!config) {
            // 설정이 없으면 빈 응답
            return NextResponse.json<ConfigResponse>({
                success: true,
                config: undefined,
            });
        }

        return NextResponse.json<ConfigResponse>({
            success: true,
            config: {
                id: config.id,
                documentBoxId: config.documentBoxId,
                type: config.type,
                lastTemplateId: config.lastTemplateId,
                lastGreetingHtml: config.lastGreetingHtml,
                lastFooterHtml: config.lastFooterHtml,
                autoTemplateId: config.autoTemplateId,
            },
        });
    } catch (error) {
        console.error('Failed to fetch template config:', error);
        return NextResponse.json<ConfigResponse>(
            { success: false, error: 'Failed to fetch template config' },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST: 문서함별 템플릿 설정 저장/업데이트
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<ConfigResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: SaveConfigRequest = await request.json();
        const {
            documentBoxId,
            type,
            lastTemplateId,
            lastGreetingHtml,
            lastFooterHtml,
            autoTemplateId,
        } = body;

        if (!documentBoxId || !type) {
            return NextResponse.json<ConfigResponse>(
                { success: false, error: 'documentBoxId and type are required' },
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
            return NextResponse.json<ConfigResponse>(
                { success: false, error: 'Document box not found' },
                { status: 404 }
            );
        }

        // upsert로 설정 저장/업데이트
        const config = await prisma.documentBoxTemplateConfig.upsert({
            where: {
                documentBoxId_type: {
                    documentBoxId,
                    type,
                },
            },
            update: {
                ...(lastTemplateId !== undefined && { lastTemplateId }),
                ...(lastGreetingHtml !== undefined && { lastGreetingHtml }),
                ...(lastFooterHtml !== undefined && { lastFooterHtml }),
                ...(autoTemplateId !== undefined && { autoTemplateId }),
            },
            create: {
                documentBoxId,
                type,
                lastTemplateId: lastTemplateId ?? null,
                lastGreetingHtml: lastGreetingHtml ?? null,
                lastFooterHtml: lastFooterHtml ?? null,
                autoTemplateId: autoTemplateId ?? null,
            },
        });

        return NextResponse.json<ConfigResponse>({
            success: true,
            config: {
                id: config.id,
                documentBoxId: config.documentBoxId,
                type: config.type,
                lastTemplateId: config.lastTemplateId,
                lastGreetingHtml: config.lastGreetingHtml,
                lastFooterHtml: config.lastFooterHtml,
                autoTemplateId: config.autoTemplateId,
            },
        });
    } catch (error) {
        console.error('Failed to save template config:', error);
        return NextResponse.json<ConfigResponse>(
            { success: false, error: 'Failed to save template config' },
            { status: 500 }
        );
    }
}
