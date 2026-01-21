import DocumentRegistrationForm from "@/components/dashboard/DocumentRegistrationForm";
import { ensureAuthenticated } from "@/lib/auth";
import { getDocumentBoxForEdit } from "@/lib/queries/document-box";
import { getUserDefaultLogo } from "@/lib/queries/logo";
import { notFound } from "next/navigation";

export default async function EditDocumentBoxPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await ensureAuthenticated();
    const { id } = await params;

    // 병렬로 문서함 데이터와 사용자 기본 로고 조회
    const [documentBox, userDefaultLogoUrl] = await Promise.all([
        getDocumentBoxForEdit(id, user.id),
        getUserDefaultLogo(user.id),
    ]);

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
        deadline: documentBox.endDate.toISOString(),
        reminderEnabled: documentBox.documentBoxRemindTypes.length > 0,
        emailReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'EMAIL'),
        smsReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'SMS'),
        kakaoReminder: documentBox.documentBoxRemindTypes.some((t) => t.remindType === 'PUSH'),
        reminderSchedules: documentBox.reminderSchedules.map((s) => ({
            id: s.id,
            timeValue: s.timeValue,
            timeUnit: s.timeUnit,
            sendTime: s.sendTime,
        })),
        status: documentBox.status,
        // 폼 필드 데이터 (정보 입력 항목 - 그룹 없이 직접 연결)
        formFieldsAboveDocuments: documentBox.formFieldsAboveDocuments,
        // 기존 formFieldGroups 형식 유지 (호환성) - 하나의 기본 그룹으로 래핑
        formFieldGroups: documentBox.formFields.length > 0
            ? [{
                id: 'default-group',
                groupTitle: '입력 항목',
                groupDescription: '',
                isRequired: true,
                order: 0,
                fields: documentBox.formFields.map((field) => ({
                    id: field.formFieldId,
                    fieldLabel: field.fieldLabel,
                    fieldType: field.fieldType,
                    placeholder: field.placeholder || '',
                    description: field.description || '',
                    isRequired: field.isRequired,
                    order: field.order,
                    options: (field.options as string[]) || [],
                    hasOtherOption: field.hasOtherOption,
                })),
            }]
            : [],
    };

    return (
        <main className="container mx-auto max-w-6xl px-4 py-8">
            <DocumentRegistrationForm
                mode="edit"
                documentBoxId={id}
                initialData={initialData}
                userDefaultLogoUrl={userDefaultLogoUrl}
            />
        </main>
    );
}
 