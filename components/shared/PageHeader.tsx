import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    /** 정렬 방식: left는 좌측 정렬 + 우측 액션, center는 가운데 정렬 */
    align?: 'left' | 'center';
    /** 우측에 표시할 액션 버튼들 (align='left'일 때만 표시) */
    actions?: ReactNode;
    /** 제목 옆에 표시할 상태 Badge (예: 문서함 상태) */
    statusBadge?: ReactNode;
}

/**
 * 페이지 헤더 컴포넌트
 * - 표준 타이포그래피: h1 text-3xl, 설명 text-lg
 * - left: 좌측 제목/설명 + 우측 액션 버튼
 * - center: 가운데 정렬 제목/설명
 * - statusBadge: 제목 옆에 상태 표시 (예: 열림/닫힘)
 */
export function PageHeader({
    title,
    description,
    align = 'left',
    actions,
    statusBadge,
}: PageHeaderProps) {
    if (align === 'center') {
        return (
            <header className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {title}
                    </h1>
                    {statusBadge}
                </div>
                {description && (
                    <p className="text-lg font-normal leading-7 text-slate-500 mt-1">
                        {description}
                    </p>
                )}
            </header>
        );
    }

    return (
        <header className="mb-8">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {title}
                        </h1>
                        {statusBadge}
                    </div>
                    {description && (
                        <p className="text-lg text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>
        </header>
    );
}
