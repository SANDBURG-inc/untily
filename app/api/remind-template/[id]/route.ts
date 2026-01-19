/**
 * 리마인드 이메일 템플릿 개별 API
 *
 * GET: 단일 템플릿 조회
 * PUT: 템플릿 수정
 * DELETE: 템플릿 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';
import type { TemplateType } from '@/lib/generated/prisma/client';

// ============================================================================
// 타입 정의
// ============================================================================

interface TemplateResponse {
    success: boolean;
    template?: {
        id: string;
        name: string;
        type: TemplateType;
        greetingHtml: string;
        footerHtml: string;
        createdAt: Date;
        updatedAt: Date;
    };
    error?: string;
}

interface UpdateTemplateRequest {
    name?: string;
    greetingHtml?: string;
    footerHtml?: string;
}

interface DeleteResponse {
    success: boolean;
    error?: string;
}

// ============================================================================
// GET: 단일 템플릿 조회
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<TemplateResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const template = await prisma.remindTemplate.findFirst({
            where: {
                id,
                userId: user.id,
            },
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

        if (!template) {
            return NextResponse.json<TemplateResponse>(
                { success: false, error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<TemplateResponse>({
            success: true,
            template,
        });
    } catch (error) {
        console.error('Failed to fetch template:', error);
        return NextResponse.json<TemplateResponse>(
            { success: false, error: 'Failed to fetch template' },
            { status: 500 }
        );
    }
}

// ============================================================================
// PUT: 템플릿 수정
// ============================================================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<TemplateResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body: UpdateTemplateRequest = await request.json();
        const { name, greetingHtml, footerHtml } = body;

        // 템플릿 존재 및 소유권 확인
        const existing = await prisma.remindTemplate.findFirst({
            where: {
                id,
                userId: user.id,
            },
        });

        if (!existing) {
            return NextResponse.json<TemplateResponse>(
                { success: false, error: 'Template not found' },
                { status: 404 }
            );
        }

        // 템플릿 업데이트
        const template = await prisma.remindTemplate.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(greetingHtml !== undefined && { greetingHtml }),
                ...(footerHtml !== undefined && { footerHtml }),
            },
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

        return NextResponse.json<TemplateResponse>({
            success: true,
            template,
        });
    } catch (error) {
        console.error('Failed to update template:', error);
        return NextResponse.json<TemplateResponse>(
            { success: false, error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE: 템플릿 삭제
// ============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json<DeleteResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // 템플릿 존재 및 소유권 확인
        const existing = await prisma.remindTemplate.findFirst({
            where: {
                id,
                userId: user.id,
            },
        });

        if (!existing) {
            return NextResponse.json<DeleteResponse>(
                { success: false, error: 'Template not found' },
                { status: 404 }
            );
        }

        // 템플릿 삭제
        await prisma.remindTemplate.delete({
            where: { id },
        });

        return NextResponse.json<DeleteResponse>({
            success: true,
        });
    } catch (error) {
        console.error('Failed to delete template:', error);
        return NextResponse.json<DeleteResponse>(
            { success: false, error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
