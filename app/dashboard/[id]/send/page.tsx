import prisma from "@/lib/db";
import { ensureAuthenticated } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ReminderSendForm } from "@/components/dashboard/SendForm";

export default async function ReminderSendPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await ensureAuthenticated();

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
        <main className="container mx-auto max-w-6xl px-4 py-8">
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
        </main>
    );
}
