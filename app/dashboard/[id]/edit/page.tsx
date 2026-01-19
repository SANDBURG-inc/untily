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
                templates: (r.templates as { s3Key: string; filename: string }[]) || [],
                allowMultiple: r.allowMultipleFiles ?? false,
            }))
            : [{ id: '1', name: '', type: '필수', description: '', templates: [], allowMultiple: false }],
        deadline: documentBox.endDate.toISOString().split('T')[0],
        reminderEnabled: documentBox.documentBoxRemindTypes.length > 0,
        emailReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'EMAIL'),
        smsReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'SMS'),
        kakaoReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'PUSH'),
        status: documentBox.status,
        // 폼 필드 그룹 데이터 (정보 입력 항목)
        formFieldsAboveDocuments: documentBox.formFieldsAboveDocuments,
        formFieldGroups: documentBox.formFieldGroups.map((group) => ({
            id: group.formFieldGroupId,
            groupTitle: group.groupTitle,
            groupDescription: group.groupDescription || '',
            isRequired: group.isRequired,
            order: group.order,
            fields: group.formFields.map((field) => ({
                id: field.formFieldId,
                fieldLabel: field.fieldLabel,
                fieldType: field.fieldType,
                placeholder: field.placeholder || '',
                isRequired: field.isRequired,
                order: field.order,
                options: (field.options as string[]) || [],
            })),
        })),
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
 