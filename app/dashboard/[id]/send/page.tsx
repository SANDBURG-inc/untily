import prisma from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { redirect, notFound } from "next/navigation";
import { ReminderSendForm } from "@/components/dashboard/SendForm";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function ReminderSendPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await stackServerApp.getUser();
    if (!user) {
        redirect("/sign-in");
    }

    const { id } = await params;

    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId: id },
        include: {
            submitters: {
                include: {
                    submittedDocuments: true // To check submission status
                }
            },
            requiredDocuments: true
        }
    });

    if (!documentBox) {
        notFound();
    }

    // Security Check: Only owner can send reminders
    if (documentBox.userId !== user.id) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <div className="py-8 px-4">
                <ReminderSendForm
                    documentBoxId={documentBox.documentBoxId}
                    documentBoxTitle={documentBox.boxTitle}
                    endDate={documentBox.endDate}
                    submitters={documentBox.submitters.map(s => ({
                        submitterId: s.submitterId,
                        name: s.name,
                        email: s.email,
                        submittedDocuments: s.submittedDocuments
                    }))}
                    requiredDocuments={documentBox.requiredDocuments.map(d => ({
                        id: d.requiredDocumentId,
                        name: d.documentTitle,
                        description: d.documentDescription,
                        isRequired: d.isRequired
                    }))}
                />
            </div>
        </div>
    );
}
