import DocumentRegistrationForm from "@/components/dashboard/DocumentRegistrationForm";
import { ensureAuthenticated } from "@/lib/auth";
import { getDocumentBoxForEdit } from "@/lib/queries/document-box";
import { notFound } from "next/navigation";

export default async function EditDocumentBoxPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await ensureAuthenticated();
    const { id } = await params;

    const documentBox = await getDocumentBoxForEdit(id, user.id);

    if (!documentBox) {
        notFound();
    }

    // Transform data for the form
    const initialData = {
        documentName: documentBox.boxTitle,
        description: documentBox.boxDescription || '',
        logoUrl: documentBox.logos[0]?.imageUrl || '',
        submittersEnabled: documentBox.submitters.length > 0,
        submitters: documentBox.submitters.length > 0
            ? documentBox.submitters.map((s) => ({
                id: s.submitterId,
                name: s.name,
                email: s.email,
                phone: s.phone || '',
            }))
            : [{ id: '1', name: '', email: '', phone: '' }],
        requirements: documentBox.requiredDocuments.length > 0
            ? documentBox.requiredDocuments.map((r) => ({
                id: r.requiredDocumentId,
                name: r.documentTitle,
                type: r.isRequired ? '필수' : '옵션',
                description: r.documentDescription || '',
            }))
            : [{ id: '1', name: '', type: '필수', description: '' }],
        deadline: documentBox.endDate.toISOString().split('T')[0],
        reminderEnabled: documentBox.documentBoxRemindTypes.length > 0,
        emailReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'EMAIL'),
        smsReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'SMS'),
        kakaoReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'PUSH'),
    };

    return (
        <main className="container mx-auto max-w-6xl px-4 py-8">
            <DocumentRegistrationForm
                mode="edit"
                documentBoxId={id}
                initialData={initialData}
            />
        </main>
    );
}
