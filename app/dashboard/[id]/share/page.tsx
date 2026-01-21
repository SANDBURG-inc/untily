import prisma from "@/lib/db";
import { ensureAuthenticated } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ShareForm } from "@/components/dashboard/ShareForm";

export default async function DocumentSharePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await ensureAuthenticated();
    const { id } = await params;

    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId: id },
        include: {
            requiredDocuments: { orderBy: { order: 'asc' } }
        }
    });

    if (!documentBox) {
        notFound();
    }

    // Security Check: Only owner can access sharing page
    if (documentBox.userId !== user.id) {
        notFound();
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <ShareForm
                documentBoxId={documentBox.documentBoxId}
                documentBoxTitle={documentBox.boxTitle}
                documentBoxDescription={documentBox.boxDescription}
                endDate={documentBox.endDate}
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
