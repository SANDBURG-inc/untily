/**
 * 리마인드 이메일 템플릿 API
 *
 * GET: 저장된 템플릿 목록 조회
 * POST: 새 템플릿 생성
 *
 * @note SEND/SHARE 구분 없이 통일됨 (v0.2.0)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';

// ============================================================================
// 타입 정의
// ============================================================================

interface TemplateListResponse {
    success: boolean;
    templates?: {
        id: string;
        name: string;
        greetingHtml: string;
        footerHtml: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    error?: string;
}

interface CreateTemplateRequest {
    name: string;
    greetingHtml: string;
    footerHtml: string;
}

interface CreateTemplateResponse {
    success: boolean;
    template?: {
        id: string;
        name: string;
        greetingHtml: string;
        footerHtml: string;
    };
    error?: string;
}

// ============================================================================
// GET: 템플릿 목록 조회
// ============================================================================

export async function GET() {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<TemplateListResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const templates = await prisma.remindTemplate.findMany({
            where: {
                userId: user.id,
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                greetingHtml: true,
                footerHtml: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json<TemplateListResponse>({
            success: true,
            templates,
        });
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return NextResponse.json<TemplateListResponse>(
            { success: false, error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST: 새 템플릿 생성
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<CreateTemplateResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: CreateTemplateRequest = await request.json();
        const { name, greetingHtml, footerHtml } = body;

        // 유효성 검사
        if (!name || !greetingHtml || !footerHtml) {
            return NextResponse.json<CreateTemplateResponse>(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 템플릿 생성
        const template = await prisma.remindTemplate.create({
            data: {
                name,
                greetingHtml,
                footerHtml,
                userId: user.id,
            },
            select: {
                id: true,
                name: true,
                greetingHtml: true,
                footerHtml: true,
            },
        });

        return NextResponse.json<CreateTemplateResponse>({
            success: true,
            template,
        });
    } catch (error) {
        console.error('Failed to create template:', error);
        return NextResponse.json<CreateTemplateResponse>(
            { success: false, error: 'Failed to create template' },
            { status: 500 }
        );
    }
}
