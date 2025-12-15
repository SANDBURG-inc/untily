'use server';

import prisma from "@/lib/db";
import { RemindType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function disableAutoReminder(documentBoxId: string) {
    try {
        await prisma.documentBoxRemindType.deleteMany({
            where: { documentBoxId },
        });
        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to disable auto reminder:", error);
        return { success: false, error: "Failed to disable auto reminder" };
    }
}

export async function enableAutoReminder(documentBoxId: string, type: RemindType) {
    try {
        // 이미 존재하는지 확인 후 생성 (중복 방지)
        const exists = await prisma.documentBoxRemindType.findUnique({
            where: {
                documentBoxId_remindType: {
                    documentBoxId,
                    remindType: type,
                },
            },
        });

        if (!exists) {
            await prisma.documentBoxRemindType.create({
                data: {
                    documentBoxId,
                    remindType: type,
                },
            });
        }
        revalidatePath(`/dashboard/${documentBoxId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to enable auto reminder:", error);
        return { success: false, error: "Failed to enable auto reminder" };
    }
}
