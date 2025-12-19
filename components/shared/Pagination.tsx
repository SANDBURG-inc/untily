/**
 * 페이지네이션 컴포넌트
 *
 * 목록 페이지에서 사용하는 이전/다음 페이지 네비게이션을 제공합니다.
 * Server Component에서 사용 가능하며, Link 기반으로 동작합니다.
 *
 * @module components/shared/Pagination
 *
 * @example
 * // 기본 사용
 * <Pagination
 *     currentPage={1}
 *     totalPages={5}
 *     createPageUrl={(page) => `/list?page=${page}`}
 * />
 *
 * @example
 * // 동적 라우트에서 사용
 * <Pagination
 *     currentPage={currentPage}
 *     totalPages={totalPages}
 *     createPageUrl={(page) => `/dashboard/${id}/items?page=${page}`}
 * />
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// ============================================================================
// Types
// ============================================================================

interface PaginationProps {
    /** 현재 페이지 번호 (1부터 시작) */
    currentPage: number;
    /** 총 페이지 수 */
    totalPages: number;
    /** 페이지 번호를 받아 해당 페이지 URL을 반환하는 함수 */
    createPageUrl: (page: number) => string;
    /** 페이지 정보 표시 여부 (기본: true) */
    showPageInfo?: boolean;
    /** 이전 버튼 텍스트 (기본: '이전') */
    prevLabel?: string;
    /** 다음 버튼 텍스트 (기본: '다음') */
    nextLabel?: string;
    /** 추가 CSS 클래스 */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Pagination({
    currentPage,
    totalPages,
    createPageUrl,
    showPageInfo = true,
    prevLabel = '이전',
    nextLabel = '다음',
    className = '',
}: PaginationProps) {
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;
    const displayTotalPages = totalPages > 0 ? totalPages : 1;

    return (
        <div className={`flex items-center justify-between mt-4 px-2 ${className}`}>
            {showPageInfo && (
                <span className="text-sm text-gray-500">
                    {currentPage} / {displayTotalPages}
                </span>
            )}

            <div className={`flex gap-2 ${!showPageInfo ? 'ml-auto' : ''}`}>
                {hasPrevPage ? (
                    <Button variant="secondary" size="sm" asChild>
                        <Link href={createPageUrl(currentPage - 1)}>
                            {prevLabel}
                        </Link>
                    </Button>
                ) : (
                    <Button variant="secondary" size="sm" disabled>
                        {prevLabel}
                    </Button>
                )}

                {hasNextPage ? (
                    <Button variant="secondary" size="sm" asChild>
                        <Link href={createPageUrl(currentPage + 1)}>
                            {nextLabel}
                        </Link>
                    </Button>
                ) : (
                    <Button variant="secondary" size="sm" disabled>
                        {nextLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
