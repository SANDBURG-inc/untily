/**
 * 리마인드 이메일 템플릿 API
 *
 * GET: 전역 템플릿 목록 조회
 * POST: 새 템플릿 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import type { TemplateType } from '@/lib/generated/prisma/client';

// ============================================================================
// 타입 정의
// ============================================================================

interface TemplateListResponse {
    success: boolean;
    templates?: {
        id: string;
        name: string;
        type: TemplateType;
        greetingHtml: string;
        footerHtml: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    error?: string;
}

interface CreateTemplateRequest {
    name: string;
    type: 'SEND' | 'SHARE';
    greetingHtml: string;
    footerHtml: string;
}

interface CreateTemplateResponse {
    success: boolean;
    template?: {
        id: string;
        name: string;
        type: TemplateType;
        greetingHtml: string;
        footerHtml: string;
    };
    error?: string;
}

// ============================================================================
// GET: 템플릿 목록 조회
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<TemplateListResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as TemplateType | null;

        const templates = await prisma.remindTemplate.findMany({
            where: {
                userId: user.id,
                ...(type && { type }),
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
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
        const { name, type, greetingHtml, footerHtml } = body;

        // 유효성 검사
        if (!name || !type || !greetingHtml || !footerHtml) {
            return NextResponse.json<CreateTemplateResponse>(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (type !== 'SEND' && type !== 'SHARE') {
            return NextResponse.json<CreateTemplateResponse>(
                { success: false, error: 'Invalid template type' },
                { status: 400 }
            );
        }

        // 템플릿 생성
        const template = await prisma.remindTemplate.create({
            data: {
                name,
                type,
                greetingHtml,
                footerHtml,
                userId: user.id,
            },
            select: {
                id: true,
                name: true,
                type: true,
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
