import { ProgressBar } from "./ProgressBar";
import Link from "next/link";

interface DocumentCardProps {
    title: string;
    description: string;
    createdDate: string;
    dueDate: string;
    currentCount: number;
    totalCount: number;
    unsubmittedCount: number;
    status: "In Progress" | "Completed";
    hasLimitedSubmitters?: boolean;
    documentBoxId: string;
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
}: DocumentCardProps) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white mb-3">
                    {status === "In Progress" ? "진행중" : "완료"}
                </span>
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

            {hasLimitedSubmitters && <ProgressBar current={currentCount} total={totalCount} />}

            <div className="flex-1"></div>

            <Link href={`/dashboard/${documentBoxId}`} className="block w-full mt-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-center">
                자세히 보기
            </Link>
        </div>
    );
}
