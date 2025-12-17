import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { neonAuth } from '@neondatabase/neon-js/auth/next';

export async function GET() {
    try {
        // Check authentication
        const { user } = await neonAuth();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch document boxes for the current user
        const documentBoxes = await prisma.documentBox.findMany({
            where: {
                userId: user.id,
            },
            include: {
                submitters: true,
                requiredDocuments: true,
                documentBoxRemindTypes: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform data to match the format expected by the frontend
        const transformedBoxes = documentBoxes.map((box) => ({
            id: box.documentBoxId,
            title: box.boxTitle,
            description: box.boxDescription || '',
            createdDate: box.createdAt.toISOString().split('T')[0],
            dueDate: box.endDate.toISOString().split('T')[0],
            totalCount: box.submitters.length,
            currentCount: 0, // TODO: Calculate from submitted documents
            unsubmittedCount: box.submitters.length, // TODO: Calculate from submitted documents
            status: new Date() > box.endDate ? 'Completed' : 'In Progress',
            requiredDocumentsCount: box.requiredDocuments.length,
        }));

        return NextResponse.json({ documentBoxes: transformedBoxes });
    } catch (error) {
        console.error('Error fetching document boxes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document boxes' },
            { status: 500 }
        );
    }
}
