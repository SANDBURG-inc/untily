import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';

interface UpdateUserRequest {
  name?: string;
  phone?: string;
}

export async function PATCH(req: Request) {
  try {
    const { user } = await neonAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdateUserRequest = await req.json();
    const { name, phone } = body;

    // 업데이트할 데이터가 없으면 에러
    if (name === undefined && phone === undefined) {
      return NextResponse.json(
        { success: false, error: 'No data to update' },
        { status: 400 }
      );
    }

    // User 레코드 업데이트 (없으면 생성, 이메일 동기화 포함)
    const updatedUser = await prisma.user.upsert({
      where: { authUserId: user.id },
      update: {
        email: user.email, // Neon Auth 이메일 동기화
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
      },
      create: {
        authUserId: user.id,
        email: user.email,
        name,
        phone: phone || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
