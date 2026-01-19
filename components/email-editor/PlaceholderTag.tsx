'use client';

/**
 * 플레이스홀더 태그 컴포넌트
 *
 * {제출자_이름} 같은 플레이스홀더를 시각적으로 강조해서 표시합니다.
 */

import { User } from 'lucide-react';

interface PlaceholderTagProps {
    /** 플레이스홀더 이름 (예: "제출자") */
    name: string;
    /** 작은 크기 여부 */
    small?: boolean;
}

export function PlaceholderTag({ name, small = false }: PlaceholderTagProps) {
    return (
        <span
            className={`inline-flex items-center gap-1 bg-blue-100 text-blue-700 rounded font-medium ${
                small ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-xs'
            }`}
        >
            <User className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {name}
        </span>
    );
}

/**
 * HTML 문자열에서 플레이스홀더를 시각적으로 강조된 형태로 변환
 *
 * 예: "안녕하세요 {제출자_이름}님" → "안녕하세요 <span class='placeholder'>제출자_이름</span>님"
 */
export function highlightPlaceholders(html: string): string {
    return html.replace(
        /\{(제출자_이름)\}/g,
        '<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 text-xs font-medium align-middle">$1</span>'
    );
}
