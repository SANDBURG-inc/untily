import { LabeledProgress } from "@/components/shared/LabeledProgress";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    type DocumentBoxStatus,
    DOCUMENT_BOX_STATUS_SHORT_LABELS,
} from "@/lib/types/document";

interface DocumentCardProps {
    title: string;
    description: string;
    createdDate: string;
    dueDate: string;
    currentCount: number;
    totalCount: number;
    unsubmittedCount: number;
    status: "In Progress" | "Expired Incomplete" | "Completed";
    hasLimitedSubmitters?: boolean;
    documentBoxId: string;
    /** 문서함 상태 (OPEN, CLOSED, OPEN_SOMEONE, CLOSED_EXPIRED, OPEN_RESUME) */
    documentBoxStatus?: DocumentBoxStatus;
}

export function DocumentCard({
    title,
    description,
    createdDate,
    dueDate,
    currentCount,
    totalCount,
    unsubmittedCount,
    status,
    hasLimitedSubmitters = true,
    documentBoxId,
    documentBoxStatus = 'OPEN',
}: DocumentCardProps) {
    // 진행 상태 (완료 여부) 정보
    const getStatusInfo = () => {
        switch (status) {
            case "In Progress":
                return { label: "진행중", variant: "primary" as const };
            case "Expired Incomplete":
                return { label: "일정 마감, 미완료", variant: "warning" as const };
            case "Completed":
                return { label: "완료", variant: "success" as const };
            default:
                return { label: "진행중", variant: "primary" as const };
        }
    };

    // 문서함 상태별 Badge variant (조회 전용)
    const getBoxStatusVariant = (boxStatus: DocumentBoxStatus) => {
        switch (boxStatus) {
            case 'OPEN':
            case 'OPEN_RESUME':
                return 'success' as const;
            case 'OPEN_SOMEONE':
                return 'warning' as const;
            case 'CLOSED':
            case 'CLOSED_EXPIRED':
            default:
                return 'secondary' as const;
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                    </Badge>
                    <Badge variant={getBoxStatusVariant(documentBoxStatus)}>
                        {DOCUMENT_BOX_STATUS_SHORT_LABELS[documentBoxStatus]}
                    </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-slate-500 text-sm">{description}</p>
            </div>

            <div className="space-y-2 mb-6 text-sm text-slate-600">
                <div className="flex gap-2">
                    <span className="w-16 text-slate-500">생성일:</span>
                    <span>{createdDate}</span>
                </div>
                <div className="flex gap-2">
                    <span className="w-16 text-slate-500">마감일:</span>
                    <span>{dueDate}</span>
                </div>
                <div className="flex gap-2">
                    <span className="w-16 text-slate-500">제출:</span>
                    <span>
                        {hasLimitedSubmitters ? (
                            <>
                                {currentCount} / {totalCount}명
                                {unsubmittedCount > 0 && (
                                    <span className="text-orange-500 ml-1">
                                        (미제출 {unsubmittedCount}명)
                                    </span>
                                )}
                            </>
                        ) : (
                            <>{currentCount}명 제출</>
                        )}
                    </span>
                </div>
            </div>

            {hasLimitedSubmitters && <LabeledProgress label="진행률" current={currentCount} total={totalCount} displayMode="percentage" size="lg"/>}

            <div className="flex-1"></div>

            <Link href={`/dashboard/${documentBoxId}`} className="block w-full mt-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-center">
                자세히 보기
            </Link>
        </div>
    );
}
